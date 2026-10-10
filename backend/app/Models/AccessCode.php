<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AccessCode extends Model {
    protected $guarded = ['id'];
    protected $hidden = ['code_hash','user_id'];
    protected function casts(): array { return ['expires_at'=>'datetime','revoked_at'=>'datetime','allow_download'=>'boolean']; }
    public function presentations() { return $this->belongsToMany(Presentation::class); }
    public function sessions() { return $this->hasMany(ClassroomSession::class); }
    public function active(): bool { return !$this->revoked_at && $this->expires_at->isFuture(); }
}
