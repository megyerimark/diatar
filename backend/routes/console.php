<?php
use Illuminate\Support\Facades\Schedule;
use App\Models\ClassroomSession;
use App\Models\AccessCode;
Schedule::call(function(){ ClassroomSession::where('expires_at','<',now())->delete(); AccessCode::where('expires_at','<',now()->subDays(30))->delete(); })->hourly();
