<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('proposals', function (Blueprint $table) {
            $table->id();
            $table->string('kode_tiket')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('kegiatan');
            $table->enum('jenis', ['Advance Payment (Dana Di Depan)', 'Reimbursement (Diganti Kemudian)', 'Advance', 'Reimburse']);
            $table->date('tgl_pelaksanaan');
            $table->decimal('dana_diajukan', 15, 2);
            $table->string('file_proposal')->nullable();
            $table->text('catatan')->nullable();
            $table->string('status')->default('Dalam Antrean');
            $table->string('bukti_transfer')->nullable();
            $table->string('evidence_dokumen')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proposals');
    }
};
