<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pasar_id')->constrained('pasars')->onDelete('cascade');
            $table->foreignId('category_id')->nullable()->constrained('kios_categories')->onDelete('set null');
            $table->string('nomor')->comment('Kiosk number/code');
            $table->string('nama_pedagang')->nullable()->comment('Merchant name');
            $table->string('komoditas')->nullable()->comment('Main commodity sold');
            $table->enum('status', ['active', 'inactive', 'empty'])->default('empty');
            $table->decimal('luas', 8, 2)->nullable()->comment('Area in m2');
            $table->json('geometry')->nullable()->comment('GeoJSON polygon geometry');
            $table->text('keterangan')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kios');
    }
};
