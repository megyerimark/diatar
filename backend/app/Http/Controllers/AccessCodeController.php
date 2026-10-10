<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
class AccessCodeController extends Controller {
    public function index(Request $r) { return $r->user()->accessCodes()->with('presentations:id,title,extension,status')->latest()->limit(100)->get(); }
    public function store(Request $r) {
        $data=$r->validate(['name'=>'required|string|max:100','presentation_ids'=>'required|array|min:1|max:100','presentation_ids.*'=>'required|integer|distinct','duration_minutes'=>'required|integer|in:30,60,120,240','allow_download'=>'required|boolean']);
        $ids=$data['presentation_ids'];
        if($r->user()->presentations()->whereIn('id',$ids)->count()!==count($ids)) throw ValidationException::withMessages(['presentation_ids'=>'Csak a saját anyagaid oszthatók meg.']);
        $alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; $code=''; for($i=0;$i<10;$i++) $code.=$alphabet[random_int(0,strlen($alphabet)-1)];
        $share=DB::transaction(function() use($r,$data,$code,$ids){
            $share=$r->user()->accessCodes()->create(['name'=>$data['name'],'code_hash'=>hash('sha256',$code),'code_hint'=>substr($code,-4),'expires_at'=>now()->addMinutes($data['duration_minutes']),'allow_download'=>$data['allow_download']]);
            $share->presentations()->attach($ids); return $share;
        });
        return response()->json(['access'=>$share->load('presentations:id,title,extension,status'),'code'=>substr($code,0,5).'-'.substr($code,5)],201)->header('Cache-Control','no-store');
    }
    public function revoke(Request $r,int $id) {
        $share=$r->user()->accessCodes()->findOrFail($id); $share->update(['revoked_at'=>now()]); $share->sessions()->delete();
        return response()->json(['message'=>'A tantermi hozzáférést lezártad.']);
    }
}
