<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
class FolderController extends Controller {
    public function index(Request $r) { return $r->user()->folders()->withCount('presentations')->orderBy('name')->get(); }
    public function store(Request $r) { return response()->json($r->user()->folders()->create($r->validate(['name'=>'required|string|max:100','color'=>'required|regex:/^#[0-9a-fA-F]{6}$/'])),201); }
    public function update(Request $r, int $id) { $f=$r->user()->folders()->findOrFail($id); $f->update($r->validate(['name'=>'required|string|max:100','color'=>'required|regex:/^#[0-9a-fA-F]{6}$/'])); return $f; }
    public function destroy(Request $r, int $id) { $r->user()->folders()->findOrFail($id)->delete(); return response()->json(['message'=>'A mappa törölve. Az anyagok a tárhelyen maradtak.']); }
}
