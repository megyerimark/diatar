<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
class User extends Authenticatable {
    use HasFactory, Notifiable;
    protected $fillable = ['name','email','password','storage_limit_bytes'];
    protected $hidden = ['password','remember_token'];
    protected function casts(): array { return ['email_verified_at'=>'datetime','password'=>'hashed','storage_limit_bytes'=>'integer']; }
    public function presentations() { return $this->hasMany(Presentation::class); }
    public function folders() { return $this->hasMany(Folder::class); }
    public function accessCodes() { return $this->hasMany(AccessCode::class); }
    public function usedBytes(): int { return (int) $this->presentations()->sum('size_bytes') + (int) $this->presentations()->sum('preview_size_bytes'); }
}
