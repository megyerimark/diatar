<?php
namespace App\Jobs;
use App\Models\Presentation;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
class ConvertPresentation implements ShouldQueue {
    use Queueable;
    public int $tries=2;
    public int $timeout=100;
    public function __construct(public int $presentationId) {}
    public function handle(): void {
        $p=Presentation::find($this->presentationId); if(!$p || $p->extension!=='pptx' || $p->status==='ready') return;
        $p->update(['status'=>'processing']); $dir=storage_path('app/conversion/'.Str::uuid()); File::makeDirectory($dir,0700,true);
        $profile=$dir.'/profile'; File::makeDirectory($profile,0700,true);
        File::put($profile.'/registrymodifications.xcu','<?xml version="1.0"?><oor:items xmlns:oor="http://openoffice.org/2001/registry"><item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse"><value>3</value></prop></item></oor:items>');
        try {
            File::copy(Storage::disk('local')->path($p->original_path),$dir.'/input.pptx');
            $process=new Process([config('diatar.libreoffice'),'-env:UserInstallation=file://'.$profile,'--headless','--norestore','--convert-to','pdf:impress_pdf_Export','--outdir',$dir,$dir.'/input.pptx']);
            $process->setTimeout(75); $process->mustRun();
            if(!is_file($dir.'/input.pdf') || filesize($dir.'/input.pdf')<5) throw new \RuntimeException('No PDF output');
            DB::transaction(function() use($p,$dir){
                $u=User::whereKey($p->user_id)->lockForUpdate()->first(); if(!$u) return;
                $current=Presentation::whereKey($p->id)->lockForUpdate()->first(); if(!$current || $current->status==='ready') return;
                $size=filesize($dir.'/input.pdf'); if($u->usedBytes()-$current->preview_size_bytes+$size>$u->storage_limit_bytes) throw new \RuntimeException('Quota');
                $path=dirname($current->original_path).'/preview.pdf';
                Storage::disk('local')->put($path,file_get_contents($dir.'/input.pdf'));
                $current->update(['preview_path'=>$path,'preview_size_bytes'=>$size,'status'=>'ready','conversion_error'=>null]);
            });
        } catch(\Throwable $e) {
            Presentation::whereKey($p->id)->where('status','processing')->update(['status'=>'failed','conversion_error'=>'Az automatikus PDF-átalakítás nem sikerült. Tölts fel egy PDF-változatot, vagy próbáld újra.']);
            report($e);
        } finally { File::deleteDirectory($dir); }
    }
    public function failed(?\Throwable $exception): void {
        Presentation::whereKey($this->presentationId)->whereIn('status',['pending','processing'])->update(['status'=>'failed','conversion_error'=>'Az átalakítás megszakadt. Próbáld újra, vagy tölts fel PDF-változatot.']);
    }
}
