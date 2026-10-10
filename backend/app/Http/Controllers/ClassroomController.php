<?php
namespace App\Http\Controllers;
use App\Models\AccessCode;
use App\Models\ClassroomSession;
use App\Services\PresentationFiles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
class ClassroomController extends Controller {
    private function access(Request $r): AccessCode {
        $token=$r->cookie('diatar_classroom');
        $session=$token?ClassroomSession::with('accessCode')->where('token_hash',hash('sha256',$token))->first():null;
        abort_unless($session && $session->expires_at->isFuture() && $session->accessCode && $session->accessCode->active(),403,'A hozzáférés lejárt vagy lezárták. Kérj új kódot.');
        return $session->accessCode;
    }
    public function enter(Request $r) {
        $r->validate(['code'=>'required|string|max:30']); $code=preg_replace('/[^A-Z0-9]/','',strtoupper($r->input('code')));
        $share=AccessCode::where('code_hash',hash('sha256',$code))->first();
        abort_unless($share && $share->active(),422,'A kód érvénytelen vagy lejárt.');
        $old=$r->cookie('diatar_classroom'); if($old) ClassroomSession::where('token_hash',hash('sha256',$old))->delete();
        $token=bin2hex(random_bytes(32)); $share->sessions()->create(['token_hash'=>hash('sha256',$token),'expires_at'=>$share->expires_at]);
        $minutes=max(1,(int) ceil(now()->diffInSeconds($share->expires_at)/60));
        $cookie=Cookie::make('diatar_classroom',$token,$minutes,'/',null,(bool) config('session.secure'),true,false,'strict');
        return response()->json($this->payload($share))->cookie($cookie)->header('Cache-Control','no-store');
    }
    private function payload(AccessCode $share): array { return ['name'=>$share->name,'expires_at'=>$share->expires_at,'allow_download'=>$share->allow_download,'presentations'=>$share->presentations()->with('folder:id,name,color')->get()]; }
    public function index(Request $r) { return response()->json($this->payload($this->access($r)))->header('Cache-Control','no-store'); }
    public function show(Request $r,int $id) { return $this->access($r)->presentations()->findOrFail($id); }
    public function file(Request $r,int $id,PresentationFiles $files) { $share=$this->access($r); abort_unless($share->allow_download,403,'A letöltést a tanár kikapcsolta.'); return $files->response($share->presentations()->findOrFail($id)); }
    public function preview(Request $r,int $id,PresentationFiles $files) { return $files->response($this->access($r)->presentations()->findOrFail($id),true); }
    public function leave(Request $r) {
        if($token=$r->cookie('diatar_classroom')) ClassroomSession::where('token_hash',hash('sha256',$token))->delete();
        return response()->json(['message'=>'A tantermi munkamenet lezárva.'])->withCookie(Cookie::forget('diatar_classroom'));
    }
}
