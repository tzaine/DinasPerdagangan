<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Find Klitikan GIS layer
$layer = \App\Models\GisLayer::where('pasar_id', 2)->whereNotNull('geojson')->first();
if (!$layer) {
    echo "Layer Klitikan tidak ditemukan.\n";
    exit(1);
}

$decoded = is_string($layer->geojson) ? json_decode($layer->geojson, true) : $layer->geojson;
$features = $decoded['features'] ?? [];
$pasarId = $layer->pasar_id;

echo "Layer: {$layer->name} (ID: {$layer->id}, Pasar ID: $pasarId)\n";
echo "Jumlah fitur: " . count($features) . "\n\n";

// Show sample property keys
if (!empty($features[0]['properties'])) {
    echo "Property keys: " . implode(', ', array_keys($features[0]['properties'])) . "\n\n";
}

$count = 0;
foreach ($features as $f) {
    $props = $f['properties'] ?? [];
    if (empty($props)) continue;

    $nomor = $props['NomorKios'] ?? $props['No_Lapak'] ?? $props['no_kios'] ?? $props['nomor'] ?? $props['OBJECTID'] ?? null;
    if (!$nomor) continue;

    $pedagang = $props['NamaPemilik'] ?? $props['Pemilik'] ?? $props['Kepemilikan'] ?? $props['nama_pedagang'] ?? null;
    $komoditas = $props['Komoditi'] ?? $props['komoditas'] ?? null;
    $catName = $props['KategoriKomoditi'] ?? $props['kategori'] ?? null;
    $luas = $props['Luas'] ?? $props['luas'] ?? $props['Ukuran'] ?? null;
    $keterangan = $props['Keterangan'] ?? $props['keterangan'] ?? null;

    if (is_string($luas)) {
        $luas = preg_replace('/[^0-9.]/', '', str_replace(',', '.', $luas));
        $luas = floatval($luas) ?: null;
    }

    $catId = null;
    if ($catName) {
        $category = \App\Models\KiosCategory::firstOrCreate(
            ['name' => $catName],
            ['color_hex' => '#0057A8', 'icon' => 'store']
        );
        $catId = $category->id;
    }

    $status = 'active';
    if (empty($pedagang) || strtolower($pedagang) === 'kosong') {
        $status = 'empty';
    }

    $kios = \App\Models\Kios::updateOrCreate(
        ['pasar_id' => $pasarId, 'nomor' => (string) $nomor],
        [
            'category_id'   => $catId,
            'nama_pedagang' => $pedagang ? (string) $pedagang : null,
            'komoditas'     => $komoditas ? (string) $komoditas : null,
            'status'        => $status,
            'luas'          => $luas,
            'keterangan'    => $keterangan,
            'geometry'      => $f['geometry'] ?? null,
        ]
    );

    $count++;
    if ($count <= 5) {
        echo "Kios $nomor => Pedagang: " . ($pedagang ?? 'NULL') . "\n";
    }
}

echo "\nBerhasil re-sync $count kios untuk Pasar Klitikan.\n";
