<?php
namespace App\Services;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use ZipArchive;
class FileValidator {
    public function validate(UploadedFile $file, bool $pdfOnly=false): string {
        $ext=strtolower($file->getClientOriginalExtension());
        if (!in_array($ext,$pdfOnly?['pdf']:['pdf','pptx'],true)) $this->fail();
        if ($ext==='pdf') {
            $h=fopen($file->getRealPath(),'rb'); $head=fread($h,5); fclose($h);
            if ($head!=='%PDF-') $this->fail();
        } else {
            $zip=new ZipArchive(); if ($zip->open($file->getRealPath())!==true) $this->fail();
            $valid=$zip->locateName('[Content_Types].xml')!==false && $zip->locateName('ppt/presentation.xml')!==false;
            $total=0;
            for($i=0;$i<$zip->numFiles;$i++) {
                $stat=$zip->statIndex($i); $total+=(int)$stat['size'];
                if (str_contains(strtolower($stat['name']),'vbaproject') || $total>209715200 || $zip->numFiles>10000) $valid=false;
            }
            $zip->close(); if (!$valid) $this->fail();
        }
        return $ext;
    }
    private function fail(): never { throw ValidationException::withMessages(['file'=>'Érvényes PDF vagy makrómentes PPTX fájlt válassz.']); }
}
