<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Presentation extends Model {
    protected $guarded = ['id'];
    protected $hidden = ['original_path','preview_path','user_id'];
    protected function casts(): array { return ['size_bytes'=>'integer','preview_size_bytes'=>'integer']; }
    public function user() { return $this->belongsTo(User::class); }
    public function folder() { return $this->belongsTo(Folder::class); }
    public function accessCodes() { return $this->belongsToMany(AccessCode::class); }
}
