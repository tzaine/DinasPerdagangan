<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$p = App\Models\Pasar::where('slug', 'klitikan')->first();
if ($p) {
    $p->latitude = -6.963783;
    $p->longitude = 110.434967;
    $p->save();
    echo "Klitikan coordinates updated to -6.963783, 110.434967.\n";
} else {
    echo "Pasar Klitikan not found!\n";
}
