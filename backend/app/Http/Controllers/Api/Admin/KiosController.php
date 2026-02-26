<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kios;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KiosController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Kios::with(['category', 'pasar'])
            ->withoutTrashed();

        if ($request->pasar_id) {
            $query->where('pasar_id', $request->pasar_id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('nomor', 'like', "%{$request->search}%")
                  ->orWhere('nama_pedagang', 'like', "%{$request->search}%")
                  ->orWhere('komoditas', 'like', "%{$request->search}%");
            });
        }

        $kios = $query->orderBy('pasar_id')->orderBy('nomor')
            ->paginate($request->per_page ?? 20);

        return response()->json($kios);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pasar_id'      => 'required|exists:pasars,id',
            'category_id'   => 'nullable|exists:kios_categories,id',
            'nomor'         => 'required|string|max:50',
            'nama_pedagang' => 'nullable|string|max:255',
            'komoditas'     => 'nullable|string|max:255',
            'status'        => 'required|in:active,inactive,empty',
            'luas'          => 'nullable|numeric',
            'geometry'      => 'nullable|array',
            'keterangan'    => 'nullable|string',
        ]);

        $kios = Kios::create($data);
        $kios->load('category', 'pasar');

        return response()->json($kios, 201);
    }

    public function show(Kios $kios): JsonResponse
    {
        $kios->load('category', 'pasar');
        return response()->json($kios);
    }

    public function update(Request $request, Kios $kios): JsonResponse
    {
        $data = $request->validate([
            'pasar_id'      => 'sometimes|exists:pasars,id',
            'category_id'   => 'nullable|exists:kios_categories,id',
            'nomor'         => 'sometimes|string|max:50',
            'nama_pedagang' => 'nullable|string|max:255',
            'komoditas'     => 'nullable|string|max:255',
            'status'        => 'sometimes|in:active,inactive,empty',
            'luas'          => 'nullable|numeric',
            'geometry'      => 'nullable|array',
            'keterangan'    => 'nullable|string',
        ]);

        $kios->update($data);
        $kios->load('category', 'pasar');

        return response()->json($kios);
    }

    public function destroy(Kios $kios): JsonResponse
    {
        $kios->delete();
        return response()->json(['message' => 'Kios berhasil dihapus.']);
    }
}
