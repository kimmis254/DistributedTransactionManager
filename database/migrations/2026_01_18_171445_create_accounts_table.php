<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('accounts', function (Blueprint $table) {
        $table->id();
        $table->string('account_name');
        
        // The actual safe balance
        $table->decimal('balance', 10, 2)->default(0);
        
        // CONCURRENCY CONTROL COLUMNS
        // Money currently "locked" during Phase 1
        $table->decimal('locked_amount', 10, 2)->default(0); 
        // ID of the transaction holding the lock (prevents race conditions)
        $table->string('active_transaction_id')->nullable(); 
        
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
