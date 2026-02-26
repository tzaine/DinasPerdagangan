<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kios;
use App\Models\KiosCategory;
use App\Models\Pasar;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $pasars = Pasar::where('is_active', true)->withCount('kios')->get();

        $totalKios    = Kios::count();
        $activeKios   = Kios::where('status', 'active')->count();
        $inactiveKios = Kios::where('status', 'inactive')->count();
        $emptyKios    = Kios::where('status', 'empty')->count();

        // Category distribution
        $categoryStats = KiosCategory::withCount(['kios' => function ($q) {
            $q->where('status', 'active');
        }])->orderByDesc('kios_count')->get()->map(function ($cat) {
            return [
                'name'  => $cat->name,
                'count' => $cat->kios_count,
                'color' => $cat->color_hex,
            ];
        });

        // Per-pasar occupancy - use Pasar model directly
        $pasarStats = Pasar::where('is_active', true)->get()->map(function ($p) {
            return [
                'id'       => $p->id,
                'name'     => $p->name,
                'slug'     => $p->slug,
                'total'    => $p->kios()->count(),
                'active'   => $p->kios()->where('status', 'active')->count(),
                'inactive' => $p->kios()->where('status', 'inactive')->count(),
                'empty'    => $p->kios()->where('status', 'empty')->count(),
            ];
        });

        return response()->json([
            'summary' => [
                'total_kios'    => $totalKios,
                'active_kios'   => $activeKios,
                'inactive_kios' => $inactiveKios,
                'empty_kios'    => $emptyKios,
                'occupancy_rate'=> $totalKios > 0 ? round(($activeKios / $totalKios) * 100, 1) : 0,
                'total_pasars'  => $pasars->count(),
            ],
            'categories' => $categoryStats,
            'pasars'     => $pasarStats,
        ]);
    }
}
