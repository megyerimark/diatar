<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $t) { $t->unsignedBigInteger('storage_limit_bytes')->default(1073741824); });
        Schema::create('folders', function (Blueprint $t) {
            $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->string('name', 100); $t->string('color', 7)->default('#b9c9aa'); $t->timestamps();
        });
        Schema::create('presentations', function (Blueprint $t) {
            $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->foreignId('folder_id')->nullable()->constrained()->nullOnDelete();
            $t->string('title', 160); $t->string('original_name'); $t->string('extension', 8); $t->string('original_path'); $t->string('preview_path')->nullable();
            $t->unsignedBigInteger('size_bytes'); $t->unsignedBigInteger('preview_size_bytes')->default(0); $t->string('status', 20)->default('pending');
            $t->text('conversion_error')->nullable(); $t->timestamps(); $t->index(['user_id', 'folder_id']);
        });
        Schema::create('access_codes', function (Blueprint $t) {
            $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->string('name', 100); $t->string('code_hash', 64)->unique(); $t->string('code_hint', 4);
            $t->boolean('allow_download')->default(true); $t->timestamp('expires_at'); $t->timestamp('revoked_at')->nullable(); $t->timestamps(); $t->index('expires_at');
        });
        Schema::create('access_code_presentation', function (Blueprint $t) {
            $t->foreignId('access_code_id')->constrained()->cascadeOnDelete(); $t->foreignId('presentation_id')->constrained()->cascadeOnDelete(); $t->primary(['access_code_id','presentation_id']);
        });
        Schema::create('classroom_sessions', function (Blueprint $t) {
            $t->id(); $t->foreignId('access_code_id')->constrained()->cascadeOnDelete(); $t->string('token_hash', 64)->unique(); $t->timestamp('expires_at'); $t->timestamps();
        });
    }
    public function down(): void {
        foreach (['classroom_sessions','access_code_presentation','access_codes','presentations','folders'] as $name) Schema::dropIfExists($name);
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('storage_limit_bytes'));
    }
};
