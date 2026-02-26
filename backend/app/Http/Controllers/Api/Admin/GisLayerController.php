<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\GisLayer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GisLayerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $layers = GisLayer::with('pasar')
            ->when($request->pasar_id, fn($q) => $q->where('pasar_id', $request->pasar_id))
            ->orderBy('sort_order')
            ->get();

        return response()->json($layers);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pasar_id'   => 'required|exists:pasars,id',
            'name'       => 'required|string|max:255',
            'type'       => 'required|in:polygon,point,line',
            'geojson'    => 'nullable|string',
            'color'      => 'nullable|string|max:7',
            'opacity'    => 'nullable|numeric|min:0|max:1',
            'is_active'  => 'boolean',
            'sort_order' => 'integer',
        ]);

        $layer = GisLayer::create($data);
        return response()->json($layer, 201);
    }

    public function update(Request $request, GisLayer $gisLayer): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'type'       => 'sometimes|in:polygon,point,line',
            'geojson'    => 'nullable|string',
            'color'      => 'nullable|string|max:7',
            'opacity'    => 'nullable|numeric|min:0|max:1',
            'is_active'  => 'boolean',
            'sort_order' => 'integer',
        ]);

        $gisLayer->update($data);
        return response()->json($gisLayer);
    }

    public function uploadGeojson(Request $request, GisLayer $gisLayer): JsonResponse
    {
        $request->validate(['file' => 'required|file|mimes:json,geojson|max:10240']);

        $content = file_get_contents($request->file('file')->getRealPath());

        // Validate it's valid JSON
        $decoded = json_decode($content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return response()->json(['message' => 'File GeoJSON tidak valid.'], 422);
        }

        $gisLayer->update(['geojson' => $content]);

        return response()->json([
            'message' => 'GeoJSON berhasil diupload.',
            'layer'   => $gisLayer,
        ]);
    }

    public function destroy(GisLayer $gisLayer): JsonResponse
    {
        $gisLayer->delete();
        return response()->json(['message' => 'Layer berhasil dihapus.']);
    }
}
