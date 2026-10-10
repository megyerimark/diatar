<?php
namespace App\Services;
use App\Models\Presentation;
use Illuminate\Support\Facades\Storage;
class PresentationFiles {
    public function response(Presentation $p, bool $preview=false) {
        $path=$preview?$p->preview_path:$p->original_path;
        abort_unless($path && Storage::disk('local')->exists($path),404,'A fájl még nem érhető el.');
        $headers=['Cache-Control'=>'private, no-store, max-age=0','X-Content-Type-Options'=>'nosniff'];
        if ($preview) return response()->file(Storage::disk('local')->path($path),array_merge($headers,['Content-Type'=>'application/pdf']));
        $name=preg_replace('/[\x00-\x1f\x7f\\\\\/]/u','_',$p->original_name);
        return response()->download(Storage::disk('local')->path($path),$name,$headers);
    }
}
