<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$layers = \App\Models\GisLayer::all();
foreach ($layers as $l) {
    echo "ID: {$l->id}, Name: {$l->name}, Pasar ID: {$l->pasar_id}\n";
}

echo "\nPasars:\n";
$pasars = \App\Models\Pasar::all();
foreach ($pasars as $p) {
    echo "ID: {$p->id}, Name: {$p->name}, Slug: {$p->slug}\n";
}
