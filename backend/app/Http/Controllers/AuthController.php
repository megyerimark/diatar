<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
class AuthController extends Controller {
    private function payload(User $user): array { return ['user'=>['id'=>$user->id,'name'=>$user->name,'email'=>$user->email,'storage_limit_bytes'=>$user->storage_limit_bytes,'used_bytes'=>$user->usedBytes()]]; }
    public function register(Request $r) {
        $r->merge(['email'=>strtolower((string)$r->input('email'))]);
        $data=$r->validate(['name'=>'required|string|max:100','email'=>'required|email|max:254|unique:users','password'=>['required','confirmed',PasswordRule::min(10)->letters()->numbers()]]);
        $data['email']=strtolower($data['email']); $data['storage_limit_bytes']=config('diatar.storage_bytes');
        $user=User::create($data); Auth::login($user); $r->session()->regenerate();
        return response()->json($this->payload($user),201);
    }
    public function login(Request $r) {
        $data=$r->validate(['email'=>'required|email','password'=>'required|string']); $data['email']=strtolower($data['email']);
        if (!Auth::attempt($data)) throw ValidationException::withMessages(['email'=>'Az email-cím vagy a jelszó nem megfelelő.']);
        $r->session()->regenerate(); return response()->json($this->payload($r->user()));
    }
    public function me(Request $r) { return response()->json($this->payload($r->user()))->header('Cache-Control','no-store'); }
    public function logout(Request $r) { Auth::logout(); $r->session()->invalidate(); $r->session()->regenerateToken(); return response()->json(['message'=>'Kijelentkeztél.']); }
    public function update(Request $r) {
        $data=$r->validate(['name'=>'required|string|max:100','current_password'=>'nullable|string','password'=>['nullable','confirmed',PasswordRule::min(10)->letters()->numbers()]]);
        if (!empty($data['password']) && !Hash::check((string)($data['current_password']??''),$r->user()->password)) throw ValidationException::withMessages(['current_password'=>'A jelenlegi jelszó nem megfelelő.']);
        $r->user()->update(array_filter(['name'=>$data['name'],'password'=>$data['password']??null],fn($v)=>$v!==null));
        if (!empty($data['password'])) $r->session()->regenerate();
        return response()->json($this->payload($r->user()));
    }
    public function forgot(Request $r) {
        $r->validate(['email'=>'required|email']); Password::sendResetLink(['email'=>strtolower($r->input('email'))]);
        return response()->json(['message'=>'Ha az email-címhez tartozik fiók, elküldtük a visszaállítási linket.']);
    }
    public function reset(Request $r) {
        $data=$r->validate(['token'=>'required|string','email'=>'required|email','password'=>['required','confirmed',PasswordRule::min(10)->letters()->numbers()]]);
        $status=Password::reset($data,function(User $user,string $password){ $user->forceFill(['password'=>Hash::make($password),'remember_token'=>Str::random(60)])->save(); \Illuminate\Support\Facades\DB::table('sessions')->where('user_id',$user->id)->delete(); event(new PasswordReset($user)); });
        if ($status!==Password::PASSWORD_RESET) throw ValidationException::withMessages(['email'=>'A visszaállítási link lejárt vagy érvénytelen.']);
        return response()->json(['message'=>'A jelszavad megváltozott. Most bejelentkezhetsz.']);
    }
}
