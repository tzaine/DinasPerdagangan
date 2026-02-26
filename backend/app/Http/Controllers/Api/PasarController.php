<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pasar;
use Illuminate\Http\JsonResponse;

class PasarController extends Controller
{
    public function index(): JsonResponse
    {
        $pasars = Pasar::where('is_active', true)
            ->withCount('kios')
            ->get();

        return response()->json($pasars);
    }

    public function show(Pasar $pasar): JsonResponse
    {
        $pasar->loadCount('kios');
        $pasar->load('gisLayers');

        return response()->json([
            'pasar' => $pasar,
            'stats' => $pasar->stats,
        ]);
    }

    public function kios(Pasar $pasar): JsonResponse
    {
        $kios = $pasar->kios()
            ->with('category')
            ->orderBy('nomor')
            ->get();

        return response()->json([
            'kios'  => $kios,
            'stats' => $pasar->stats,
        ]);
    }

    public function geojson(Pasar $pasar): JsonResponse
    {
        // Build GeoJSON FeatureCollection from kios geometry
        $features = $pasar->kios()
            ->with('category')
            ->whereNotNull('geometry')
            ->get()
            ->map(function ($kios) {
                return [
                    'type'       => 'Feature',
                    'geometry'   => $kios->geometry,
                    'properties' => [
                        'id'           => $kios->id,
                        'nomor'        => $kios->nomor,
                        'nama_pedagang'=> $kios->nama_pedagang,
                        'komoditas'    => $kios->komoditas,
                        'status'       => $kios->status,
                        'category'     => $kios->category?->name,
                        'color'        => $kios->category?->color_hex ?? '#0057A8',
                    ],
                ];
            });

        return response()->json([
            'type'     => 'FeatureCollection',
            'features' => $features,
        ]);
    }
}
