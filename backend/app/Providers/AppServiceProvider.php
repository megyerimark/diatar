<?php
namespace App\Providers;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
class AppServiceProvider extends ServiceProvider {
    public function register(): void {}
    public function boot(): void {
        ResetPassword::createUrlUsing(fn ($user, string $token) => rtrim(config('diatar.frontend_url'), '/').'/reset-password?token='.$token.'&email='.urlencode($user->email));
        RateLimiter::for('auth-actions', fn (Request $r) => [Limit::perMinute(30)->by($r->ip()), Limit::perMinute(5)->by(strtolower((string) $r->input('email')).'|'.$r->ip())]);
        RateLimiter::for('classroom-entry', fn (Request $r) => [Limit::perMinute(8)->by($r->ip()), Limit::perMinute(60)->by(hash('sha256', strtoupper((string) $r->input('code'))))]);
    }
}
