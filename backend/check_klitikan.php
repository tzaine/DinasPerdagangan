<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$layers = App\Models\GisLayer::whereHas('pasar', function($q) { $q->where('slug', 'klitikan'); })->get();
if ($layers->isEmpty()) {
    echo "No GIS layer found for Klitikan.\n";
} else {
    foreach ($layers as $l) {
        echo "Found layer ID: {$l->id}, Name: {$l->name}\n";
        $gj = json_decode($l->geojson, true);
        if ($gj && isset($gj['features'][0]['geometry']['coordinates'])) {
            $coords = $gj['features'][0]['geometry']['coordinates'];
            // Flatten to find first lon/lat
            while(is_array($coords) && is_array($coords[0])) { $coords = $coords[0]; }
            echo "  Sample coordinates: " . json_encode($coords) . "\n";
            // Check properties to see how we can map it to Kios
            echo "  Properties keys: " . implode(', ', array_keys($gj['features'][0]['properties'])) . "\n";
            echo "  Sample properties: " . json_encode($gj['features'][0]['properties']) . "\n";
        }
    }
}
