<?php
namespace App\Http\Controllers;
use App\Jobs\ConvertPresentation;
use App\Models\User;
use App\Services\FileValidator;
use App\Services\PresentationFiles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
class PresentationController extends Controller {
    public function index(Request $r) { return $r->user()->presentations()->with('folder:id,name,color')->latest()->get(); }
    private function folder(Request $r, $id): void { if($id!==null) $r->user()->folders()->findOrFail($id); }
    public function store(Request $r, FileValidator $validator) {
        $data=$r->validate(['file'=>['required','file','max:'.config('diatar.upload_kb')],'title'=>'nullable|string|max:160','folder_id'=>'nullable|integer']);
        $this->folder($r,$data['folder_id']??null); $file=$r->file('file'); $ext=$validator->validate($file); $path=null;
        try {
            $p=DB::transaction(function() use($r,$data,$file,$ext,&$path){
                $user=User::whereKey($r->user()->id)->lockForUpdate()->firstOrFail();
                if($user->usedBytes()+$file->getSize()>$user->storage_limit_bytes) throw ValidationException::withMessages(['file'=>'Megtelt a tárhelyed. Törölj néhány fájlt.']);
                $path=$file->storeAs('presentations/'.Str::uuid(),'original.'.$ext,'local');
                return $user->presentations()->create(['folder_id'=>$data['folder_id']??null,'title'=>$data['title']??Str::limit(pathinfo($file->getClientOriginalName(),PATHINFO_FILENAME),160,''),'original_name'=>$file->getClientOriginalName(),'extension'=>$ext,'original_path'=>$path,'preview_path'=>$ext==='pdf'?$path:null,'size_bytes'=>$file->getSize(),'status'=>$ext==='pdf'?'ready':'pending']);
            });
        } catch(\Throwable $e) { if($path) Storage::disk('local')->deleteDirectory(dirname($path)); throw $e; }
        if($ext==='pptx') ConvertPresentation::dispatch($p->id)->afterCommit();
        return response()->json($p->load('folder:id,name,color'),201);
    }
    public function show(Request $r, int $id) { return $r->user()->presentations()->with('folder:id,name,color')->findOrFail($id); }
    public function update(Request $r, int $id) {
        $p=$r->user()->presentations()->findOrFail($id); $data=$r->validate(['title'=>'required|string|max:160','folder_id'=>'nullable|integer']); $this->folder($r,$data['folder_id']??null); $p->update($data); return $p->load('folder:id,name,color');
    }
    public function destroy(Request $r, int $id) {
        $path=DB::transaction(function() use($r,$id){ User::whereKey($r->user()->id)->lockForUpdate()->firstOrFail(); $p=$r->user()->presentations()->lockForUpdate()->findOrFail($id); $path=$p->original_path; $p->delete(); return $path; });
        Storage::disk('local')->deleteDirectory(dirname($path)); return response()->json(['message'=>'A prezentáció törölve.']);
    }
    public function file(Request $r, int $id, PresentationFiles $files) { return $files->response($r->user()->presentations()->findOrFail($id)); }
    public function preview(Request $r, int $id, PresentationFiles $files) { return $files->response($r->user()->presentations()->findOrFail($id),true); }
    public function uploadPreview(Request $r,int $id,FileValidator $validator) {
        $r->validate(['file'=>['required','file','max:'.config('diatar.upload_kb')]]); $file=$r->file('file'); $validator->validate($file,true);
        $path=null; $old=null;
        try {
            $p=DB::transaction(function() use($r,$id,$file,&$path,&$old){
                $u=User::whereKey($r->user()->id)->lockForUpdate()->firstOrFail(); $p=$u->presentations()->lockForUpdate()->findOrFail($id);
                if ($u->usedBytes()-$p->preview_size_bytes+$file->getSize()>$u->storage_limit_bytes) throw ValidationException::withMessages(['file'=>'Nincs elég szabad tárhely.']);
                $old=$p->preview_path; $path=$file->storeAs(dirname($p->original_path),'preview-'.Str::uuid().'.pdf','local');
                $p->update(['preview_path'=>$path,'preview_size_bytes'=>$file->getSize(),'status'=>'ready','conversion_error'=>null]); return $p;
            });
        }catch(\Throwable $e){ if($path) Storage::disk('local')->delete($path); throw $e; }
        if($old && $old!==$p->original_path) Storage::disk('local')->delete($old);
        return $p;
    }
    public function retry(Request $r,int $id) {
        $p=$r->user()->presentations()->findOrFail($id); abort_unless($p->extension==='pptx',422);
        if(!in_array($p->status,['pending','processing'],true)){ $p->update(['status'=>'pending','conversion_error'=>null]); ConvertPresentation::dispatch($p->id); }
        return $p;
    }
}
