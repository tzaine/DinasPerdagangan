<?php

namespace Database\Seeders;

use App\Models\KiosCategory;
use App\Models\Kios;
use App\Models\Pasar;
use Illuminate\Database\Seeder;

class PasarSeeder extends Seeder
{
    public function run(): void
    {
        // Pasar Rejomulyo
        $rejomulyo = Pasar::updateOrCreate(
            ['slug' => 'rejomulyo'],
            [
                'name'        => 'Pasar Rejomulyo',
                'description' => 'Pasar tradisional di Kawasan Semarang Utara, dikenal sebagai pasar ikan dan hasil laut terbesar di Kota Semarang.',
                'address'     => 'Rejomulyo, Kec. Semarang Tim., Kota Semarang, Jawa Tengah',
                'latitude'    => -6.9640,
                'longitude'   => 110.4346,
                'is_active'   => true,
            ]
        );

        // Pasar Klitikan
        $klitikan = Pasar::updateOrCreate(
            ['slug' => 'klitikan'],
            [
                'name'        => 'Pasar Buah Klitikan',
                'description' => 'Pasar tradisional yang menjual berbagai buah dan sayuran di pusat kota Semarang.',
                'address'     => 'Plamongan Sari, Kec. Pedurungan, Kota Semarang, Jawa Tengah',
                'latitude'    => 0,
                'longitude'   => 0, 
                'is_active'   => true,
            ]
        );

        // Categories
        $categories = [
            ['name' => 'Ikan & Hasil Laut',  'color_hex' => '#0057A8', 'icon' => 'fish'],
            ['name' => 'Sayur & Buah',       'color_hex' => '#22C55E', 'icon' => 'leaf'],
            ['name' => 'Daging & Unggas',    'color_hex' => '#EF4444', 'icon' => 'meat'],
            ['name' => 'Bumbu & Rempah',     'color_hex' => '#F59E0B', 'icon' => 'spice'],
            ['name' => 'Elektronik',         'color_hex' => '#8B5CF6', 'icon' => 'zap'],
            ['name' => 'Pakaian & Tekstil',  'color_hex' => '#EC4899', 'icon' => 'shirt'],
            ['name' => 'Barang Bekas',       'color_hex' => '#6B7280', 'icon' => 'recycle'],
            ['name' => 'Makanan & Minuman',  'color_hex' => '#14B8A6', 'icon' => 'utensils'],
            ['name' => 'Jasa & Lainnya',     'color_hex' => '#64748B', 'icon' => 'settings'],
        ];

        $createdCats = [];
        foreach ($categories as $cat) {
            $createdCats[$cat['name']] = KiosCategory::updateOrCreate(
                ['name' => $cat['name']],
                $cat
            );
        }

    }
}
