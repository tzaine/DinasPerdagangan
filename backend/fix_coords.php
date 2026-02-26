<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\GisLayer;
use App\Models\Pasar;
use App\Models\Kios;
use App\Models\KiosCategory;

$pasar = Pasar::where('slug', 'rejomulyo')->first();
if (!$pasar) { echo "Pasar Rejomulyo not found!\n"; exit; }

$layer = GisLayer::where('pasar_id', $pasar->id)->whereNotNull('geojson')->first();
if (!$layer) { echo "No GIS layer found!\n"; exit; }

$decoded = json_decode($layer->geojson, true);
$features = $decoded['features'] ?? [];
echo "Found " . count($features) . " features in GeoJSON\n";

// Ensure categories exist
$catIkanBasah = KiosCategory::updateOrCreate(
    ['name' => 'Ikan Basah'],
    ['color_hex' => '#0057A8', 'icon' => 'fish']
);
$catIkanAsin = KiosCategory::updateOrCreate(
    ['name' => 'Ikan Asin'],
    ['color_hex' => '#F59E0B', 'icon' => 'fish']
);

// Delete old kios for this pasar
$deleted = Kios::where('pasar_id', $pasar->id)->forceDelete();
echo "Deleted old kios\n";

// Import kios from GeoJSON features
$imported = 0;
foreach ($features as $f) {
    $props = $f['properties'] ?? [];
    $geometry = $f['geometry'] ?? null;

    $kategori = strtoupper(trim($props['KategoriKomoditi'] ?? ''));
    $komoditi = trim($props['Komoditi'] ?? $kategori);
    $kepemilikan = trim($props['Kepemilikan'] ?? '');
    $noLapak = $props['No_Lapak'] ?? ($imported + 1);

    $categoryId = str_contains($kategori, 'ASIN') ? $catIkanAsin->id : $catIkanBasah->id;
    $status = $kepemilikan ? 'active' : 'empty';

    Kios::create([
        'pasar_id'      => $pasar->id,
        'category_id'   => $categoryId,
        'nomor'         => (string) $noLapak,
        'nama_pedagang' => $kepemilikan,
        'komoditas'     => $komoditi,
        'status'        => $status,
        'geometry'      => $geometry,  // array, will be JSON-encoded by Eloquent cast
    ]);
    $imported++;

    if ($imported % 20 == 0) echo "  Imported $imported...\n";
}

echo "Imported $imported kios from GeoJSON\n";

$total = Kios::where('pasar_id', $pasar->id)->count();
echo "Total kios in DB: $total\n";
echo "Done!\n";
