<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PasarController;
use App\Http\Controllers\Api\Admin\KiosController as AdminKiosController;
use App\Http\Controllers\Api\Admin\GisLayerController as AdminGisLayerController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

Route::get('/pasars', [PasarController::class, 'index']);
Route::get('/pasars/{pasar}', [PasarController::class, 'show']);
Route::get('/pasars/{pasar}/kios', [PasarController::class, 'kios']);
Route::get('/pasars/{pasar}/geojson', [PasarController::class, 'geojson']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Admin – Kios CRUD
    Route::apiResource('/admin/kios', AdminKiosController::class);

    // Admin – GIS Layers
    Route::get('/admin/layers', [AdminGisLayerController::class, 'index']);
    Route::post('/admin/layers', [AdminGisLayerController::class, 'store']);
    Route::put('/admin/layers/{gisLayer}', [AdminGisLayerController::class, 'update']);
    Route::delete('/admin/layers/{gisLayer}', [AdminGisLayerController::class, 'destroy']);
    Route::post('/admin/layers/{gisLayer}/upload', [AdminGisLayerController::class, 'uploadGeojson']);
});
