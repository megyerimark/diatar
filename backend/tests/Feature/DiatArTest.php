<?php
namespace Tests\Feature;
use App\Jobs\ConvertPresentation;
use App\Models\AccessCode;
use App\Models\ClassroomSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
class DiatArTest extends TestCase {
    use RefreshDatabase;
    protected function setUp(): void { parent::setUp(); Storage::fake('local'); Queue::fake(); }
    private function owner(): User { $u=User::factory()->create(); $this->actingAs($u); return $u; }
    private function pdf(string $name='lesson.pdf'): UploadedFile { return new UploadedFile(dirname(base_path()).'/frontend/public/assets/uzleti-modell.pdf',$name,'application/pdf',null,true); }
    private function upload(): int { return $this->postJson('/api/presentations',['file'=>$this->pdf(),'title'=>'Üzleti tervezés'])->assertCreated()->json('id'); }
    private function share(int $id,bool $download=true): array { return $this->postJson('/api/access-codes',['name'=>'Hétfői óra','presentation_ids'=>[$id],'duration_minutes'=>120,'allow_download'=>$download])->assertCreated()->json(); }
    private function enter(string $code): string {
        Auth::logout(); $res=$this->postJson('/api/classroom/enter',['code'=>$code])->assertOk();
        $this->withCredentials(); return $res->getCookie('diatar_classroom')->getValue();
    }
    public function test_csrf_is_required_outside_the_testing_environment(): void {
        $this->app['env']='local';
        $this->postJson('/api/auth/login',['email'=>'anna@example.com','password'=>'anything'])->assertStatus(419);
        $this->getJson('/api/csrf')->assertOk()->assertCookie('XSRF-TOKEN');
    }
    public function test_browser_xsrf_cookie_header_allows_registration(): void {
        $this->app['env']='local';
        $r=$this->withSession(['_token'=>'known-csrf-token'])->getJson('/api/csrf')->assertOk();
        $token=$r->getCookie('XSRF-TOKEN',false)->getValue();
        $session=$r->getCookie(config('session.cookie'))->getValue();
        $this->withCookie(config('session.cookie'),$session)->withCredentials()->postJson('/api/auth/register',[
            'name'=>'Anna','email'=>'csrf@example.com','password'=>'TitkosJelszo123','password_confirmation'=>'TitkosJelszo123'
        ],['X-XSRF-TOKEN'=>$token])->assertCreated();
    }
    public function test_uppercase_email_cannot_create_a_duplicate_account(): void {
        User::factory()->create(['email'=>'anna@example.com']);
        $this->postJson('/api/auth/register',['name'=>'Anna','email'=>'ANNA@example.com','password'=>'TitkosJelszo123','password_confirmation'=>'TitkosJelszo123'])->assertUnprocessable();
    }
    public function test_registration_login_and_logout(): void {
        $this->postJson('/api/auth/register',['name'=>'Kovács Anna','email'=>'anna@example.com','password'=>'TitkosJelszo123','password_confirmation'=>'TitkosJelszo123'])->assertCreated()->assertJsonPath('user.name','Kovács Anna');
        $this->getJson('/api/auth/me')->assertOk()->assertJsonMissingPath('user.password');
        $this->postJson('/api/auth/logout')->assertOk(); $this->getJson('/api/auth/me')->assertUnauthorized();
        $this->postJson('/api/auth/login',['email'=>'anna@example.com','password'=>'hibas'])->assertUnprocessable();
        $this->postJson('/api/auth/login',['email'=>'anna@example.com','password'=>'TitkosJelszo123'])->assertOk();
    }
    public function test_files_are_private_and_scoped_to_the_owner(): void {
        $first=$this->owner(); $id=$this->upload();
        $p=$first->presentations()->findOrFail($id); Storage::disk('local')->assertExists($p->original_path);
        $this->getJson('/api/presentations')->assertOk()->assertJsonMissingPath('0.original_path')->assertJsonMissingPath('0.user_id');
        $this->get('/api/presentations/'.$id.'/preview')->assertOk();
        $second=User::factory()->create();$this->actingAs($second);
        $this->getJson('/api/presentations/'.$id)->assertNotFound(); $this->get('/api/presentations/'.$id.'/file')->assertNotFound();
        $this->patchJson('/api/presentations/'.$id,['title'=>'Másik tanár anyaga'])->assertNotFound();
        $this->deleteJson('/api/presentations/'.$id)->assertNotFound();
        $this->postJson('/api/access-codes',['name'=>'Tilos','presentation_ids'=>[$id],'duration_minutes'=>120,'allow_download'=>true])->assertUnprocessable();
    }
    public function test_classroom_cookie_opens_only_selected_files_and_cannot_manage_storage(): void {
        $u=$this->owner(); $id=$this->upload();$other=$this->upload();$share=$this->share($id);
        $this->assertMatchesRegularExpression('/^[A-Z2-9]{5}-[A-Z2-9]{5}$/',$share['code']);
        $this->assertDatabaseMissing('access_codes',['code_hash'=>$share['code']]);
        $this->getJson('/api/access-codes')->assertJsonMissingPath('0.code_hash')->assertJsonMissingPath('0.code');
        $token=$this->enter($share['code']);$this->withCookie('diatar_classroom',$token);
        $this->getJson('/api/classroom')->assertOk()->assertJsonCount(1,'presentations');
        $this->get('/api/classroom/presentations/'.$id.'/preview')->assertOk();
        $this->get('/api/classroom/presentations/'.$id.'/file')->assertOk();
        $this->get('/api/classroom/presentations/'.$other.'/preview')->assertNotFound();
        $this->getJson('/api/presentations')->assertUnauthorized();
        $this->deleteJson('/api/presentations/'.$id)->assertUnauthorized();
    }
    public function test_revocation_invalidates_existing_classroom_sessions(): void {
        $u=$this->owner();$id=$this->upload();$share=$this->share($id);$token=$this->enter($share['code']);
        $this->actingAs($u)->deleteJson('/api/access-codes/'.$share['access']['id'])->assertOk();Auth::logout();
        $this->withCookie('diatar_classroom',$token)->get('/api/classroom/presentations/'.$id.'/preview')->assertForbidden();
        $this->postJson('/api/classroom/enter',['code'=>$share['code']])->assertUnprocessable();
    }
    public function test_expiry_is_enforced_at_file_access(): void {
        $this->owner();$id=$this->upload();$share=$this->share($id);$token=$this->enter($share['code']);$this->travel(121)->minutes();
        $this->withCookie('diatar_classroom',$token)->get('/api/classroom/presentations/'.$id.'/file')->assertForbidden();
    }
    public function test_download_permission_is_checked_on_the_server(): void {
        $this->owner();$id=$this->upload();$share=$this->share($id,false);$token=$this->enter($share['code']);$this->withCookie('diatar_classroom',$token);
        $this->get('/api/classroom/presentations/'.$id.'/preview')->assertOk();$this->get('/api/classroom/presentations/'.$id.'/file')->assertForbidden();
    }
    public function test_explicit_classroom_leave_invalidates_cookie(): void {
        $this->owner();$id=$this->upload();$share=$this->share($id);$token=$this->enter($share['code']);$this->withCookie('diatar_classroom',$token);
        $this->postJson('/api/classroom/leave')->assertOk();$this->getJson('/api/classroom')->assertForbidden();
    }
    public function test_invalid_files_and_full_storage_are_rejected(): void {
        $u=$this->owner();
        $this->postJson('/api/presentations',['file'=>UploadedFile::fake()->createWithContent('fake.pdf','not a pdf')])->assertUnprocessable();
        $this->postJson('/api/presentations',['file'=>UploadedFile::fake()->createWithContent('fake.pptx','not a zip')])->assertUnprocessable();
        $this->postJson('/api/presentations',['file'=>UploadedFile::fake()->create('macro.pptm')])->assertUnprocessable();
        $u->update(['storage_limit_bytes'=>10]);$this->postJson('/api/presentations',['file'=>$this->pdf()])->assertUnprocessable();
        $this->assertDatabaseCount('presentations',0);
    }
    public function test_owner_cannot_put_a_file_in_another_owners_folder(): void {
        $this->owner();$other=User::factory()->create();$folder=$other->folders()->create(['name'=>'Privát','color'=>'#abcdef']);
        $this->postJson('/api/presentations',['file'=>$this->pdf(),'folder_id'=>$folder->id])->assertNotFound();
    }
    public function test_folder_delete_keeps_files_and_file_delete_removes_bytes(): void {
        $u=$this->owner();$folder=$u->folders()->create(['name'=>'Tantárgy','color'=>'#abcdef']);
        $id=$this->postJson('/api/presentations',['file'=>$this->pdf(),'folder_id'=>$folder->id])->assertCreated()->json('id');
        $path=$u->presentations()->findOrFail($id)->original_path;
        $this->deleteJson('/api/folders/'.$folder->id)->assertOk();$this->assertDatabaseHas('presentations',['id'=>$id,'folder_id'=>null]);Storage::disk('local')->assertExists($path);
        $this->deleteJson('/api/presentations/'.$id)->assertOk();Storage::disk('local')->assertMissing($path);$this->assertSame(0,$u->usedBytes());
    }
    public function test_pptx_enqueues_conversion_and_custom_preview_is_supported(): void {
        $this->owner();$file=new UploadedFile(dirname(base_path()).'/frontend/public/assets/minta-prezentacio.pptx','lesson.pptx',null,null,true);
        $id=$this->postJson('/api/presentations',['file'=>$file])->assertCreated()->assertJsonPath('status','pending')->json('id');Queue::assertPushed(ConvertPresentation::class);
        $this->postJson('/api/presentations/'.$id.'/preview',['file'=>$this->pdf()])->assertOk()->assertJsonPath('status','ready');
        $this->get('/api/presentations/'.$id.'/preview')->assertOk();
    }
    public function test_email_reset_does_not_reveal_account_existence(): void {
        Notification::fake();$u=User::factory()->create();
        $a=$this->postJson('/api/auth/forgot-password',['email'=>$u->email])->assertOk()->json('message');
        $b=$this->postJson('/api/auth/forgot-password',['email'=>'unknown@example.com'])->assertOk()->json('message');$this->assertSame($a,$b);
        Notification::assertSentTo($u,\Illuminate\Auth\Notifications\ResetPassword::class);
    }
    public function test_invalid_code_attempts_are_rate_limited(): void {
        for($i=0;$i<8;$i++)$this->postJson('/api/classroom/enter',['code'=>'XXXXX-XXXXX'])->assertUnprocessable();
        $this->postJson('/api/classroom/enter',['code'=>'XXXXX-XXXXX'])->assertStatus(429);
    }
    public function test_real_pptx_conversion_creates_a_private_pdf(): void {
        $this->owner();$file=new UploadedFile(dirname(base_path()).'/frontend/public/assets/minta-prezentacio.pptx','sample.pptx',null,null,true);
        $id=$this->postJson('/api/presentations',['file'=>$file])->assertCreated()->json('id');
        (new ConvertPresentation($id))->handle();
        $p=\App\Models\Presentation::findOrFail($id);$this->assertSame('ready',$p->status);$this->assertGreaterThan(100,$p->preview_size_bytes);Storage::disk('local')->assertExists($p->preview_path);
    }
}
