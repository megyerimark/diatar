<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\PresentationController;
use App\Http\Controllers\AccessCodeController;
use App\Http\Controllers\ClassroomController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
Route::prefix('api')->group(function(){
    Route::get('/csrf',fn(Request $r)=>response()->json(['ok'=>true])->header('Cache-Control','no-store'));
    Route::get('/health',fn()=>response()->json(['service'=>'Diatár','ok'=>true]));
    Route::middleware('throttle:auth-actions')->group(function(){
        Route::post('/auth/register',[AuthController::class,'register']); Route::post('/auth/login',[AuthController::class,'login']);
        Route::post('/auth/forgot-password',[AuthController::class,'forgot']); Route::post('/auth/reset-password',[AuthController::class,'reset']);
    });
    Route::middleware(['auth','throttle:120,1'])->group(function(){
        Route::get('/auth/me',[AuthController::class,'me']); Route::post('/auth/logout',[AuthController::class,'logout']); Route::patch('/auth/profile',[AuthController::class,'update']);
        Route::get('/folders',[FolderController::class,'index']); Route::post('/folders',[FolderController::class,'store']); Route::patch('/folders/{id}',[FolderController::class,'update']); Route::delete('/folders/{id}',[FolderController::class,'destroy']);
        Route::get('/presentations',[PresentationController::class,'index']); Route::post('/presentations',[PresentationController::class,'store']); Route::get('/presentations/{id}',[PresentationController::class,'show']);
        Route::patch('/presentations/{id}',[PresentationController::class,'update']); Route::delete('/presentations/{id}',[PresentationController::class,'destroy']);
        Route::get('/presentations/{id}/file',[PresentationController::class,'file']); Route::get('/presentations/{id}/preview',[PresentationController::class,'preview']);
        Route::post('/presentations/{id}/preview',[PresentationController::class,'uploadPreview']); Route::post('/presentations/{id}/retry',[PresentationController::class,'retry']);
        Route::get('/access-codes',[AccessCodeController::class,'index']); Route::post('/access-codes',[AccessCodeController::class,'store']); Route::delete('/access-codes/{id}',[AccessCodeController::class,'revoke']);
    });
    Route::post('/classroom/enter',[ClassroomController::class,'enter'])->middleware('throttle:classroom-entry');
    Route::middleware('throttle:120,1')->group(function(){
        Route::get('/classroom',[ClassroomController::class,'index']); Route::post('/classroom/leave',[ClassroomController::class,'leave']);
        Route::get('/classroom/presentations/{id}',[ClassroomController::class,'show']); Route::get('/classroom/presentations/{id}/file',[ClassroomController::class,'file']); Route::get('/classroom/presentations/{id}/preview',[ClassroomController::class,'preview']);
    });
});
