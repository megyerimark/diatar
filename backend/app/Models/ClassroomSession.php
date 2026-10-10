<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ClassroomSession extends Model {
    protected $guarded = ['id'];
    protected $hidden = ['token_hash'];
    protected function casts(): array { return ['expires_at'=>'datetime']; }
    public function accessCode() { return $this->belongsTo(AccessCode::class); }
}
