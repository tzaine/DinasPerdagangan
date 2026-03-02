<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Kios;

// Temukan kios yang tidak ada datanya di GeoJSON (tidak punya geometry)
$count = Kios::whereNull('geometry')->count();
echo "Menghapus $count kios dummy (tanpa geometri)...\n";

Kios::whereNull('geometry')->forceDelete();

echo "Selesai. Total kios tersisa: " . Kios::count() . "\n";
