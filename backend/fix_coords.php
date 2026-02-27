<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\KiosCategory;
use App\Models\Kios;

$cats = KiosCategory::all();
foreach ($cats as $c) {
    $count = Kios::where('category_id', $c->id)->count();
    echo "{$c->id}: {$c->name} → color: {$c->color_hex} | kios: $count\n";
}

// Show sample kios with category
$sample = Kios::with('category')->whereNotNull('category_id')->first();
if ($sample) {
    echo "\nSample kios #{$sample->id}: nomor={$sample->nomor}, category={$sample->category?->name}, color={$sample->category?->color_hex}\n";
}
