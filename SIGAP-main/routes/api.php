<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProposalController;

Route::post('/login', [AuthController::class, 'login']);

Route::post('/test-upload', function (Illuminate\Http\Request $request) {
    $file = $request->file('file');
    if (!$file) return 'No file';
    return [
        'valid' => $file->isValid(),
        'error' => $file->getError(),
        'path' => $file->getPathname(),
        'realPath' => $file->getRealPath(),
        'isFile' => is_file($file->getPathname()),
    ];
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    
    Route::get('/proposals', [ProposalController::class, 'index']);
    Route::post('/proposals', [ProposalController::class, 'store']);
    Route::put('/proposals/{id}/status', [ProposalController::class, 'updateStatus']);
    Route::post('/proposals/{id}/upload-evidence', [ProposalController::class, 'uploadEvidence']);
    Route::post('/proposals/{id}/upload-bukti', [ProposalController::class, 'uploadBuktiTransfer']);
    Route::post('/proposals/{id}/comments', [ProposalController::class, 'addComment']);
    Route::delete('/proposals/comments/{id}', [ProposalController::class, 'deleteComment']);
    
    Route::get('/logs', [ProposalController::class, 'getLogs']);
});
