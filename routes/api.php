<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TransactionController;

// Grouping logic for clarity
Route::prefix('v1')->group(function () {
    
    // Get the status of our two nodes
    Route::get('/status', [TransactionController::class, 'status']);
    
    // Attempt a transfer (The 2PC Execution)
    Route::post('/transfer', [TransactionController::class, 'transfer']);

    // Reset the demo
    Route::post('/reset', [TransactionController::class, 'reset']);
});