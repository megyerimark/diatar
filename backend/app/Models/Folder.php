<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Folder extends Model {
    protected $fillable = ['name','color'];
    public function presentations() { return $this->hasMany(Presentation::class); }
}
