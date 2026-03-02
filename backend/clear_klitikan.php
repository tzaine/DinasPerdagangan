<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$count = \App\Models\Kios::where('pasar_id', 2)->forceDelete();
echo "Berhasil menghapus $count data Kios sisa untuk Pasar Klitikan.\n";
