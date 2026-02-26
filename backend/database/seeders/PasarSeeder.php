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
                'address'     => 'Jl. Coaster No.1, Tanjungmas, Kec. Semarang Utara, Kota Semarang',
                'latitude'    => -6.9388,
                'longitude'   => 110.4221,
                'is_active'   => true,
            ]
        );

        // Pasar Klitikan
        $klitikan = Pasar::updateOrCreate(
            ['slug' => 'klitikan'],
            [
                'name'        => 'Pasar Johar (Klitikan)',
                'description' => 'Pasar tradisional yang menjual berbagai barang bekas, elektronik, dan kebutuhan sehari-hari di pusat kota Semarang.',
                'address'     => 'Jl. KH. Agus Salim, Kauman, Kec. Semarang Tengah, Kota Semarang',
                'latitude'    => -6.9828,
                'longitude'   => 110.4077,
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

        // Sample kios for Rejomulyo
        $rejoKios = [
            ['A-01', 'Bapak Suharto',   'Ikan Segar',     'active',   'Ikan & Hasil Laut'],
            ['A-02', 'Ibu Sumarni',     'Udang & Cumi',   'active',   'Ikan & Hasil Laut'],
            ['A-03', 'Bapak Joko',      'Ikan Asin',      'active',   'Ikan & Hasil Laut'],
            ['A-04', '',                '',               'empty',    'Ikan & Hasil Laut'],
            ['B-01', 'Ibu Partini',     'Sayuran',        'active',   'Sayur & Buah'],
            ['B-02', 'Bapak Hartono',   'Buah Segar',     'active',   'Sayur & Buah'],
            ['B-03', '',                '',               'empty',    'Sayur & Buah'],
            ['C-01', 'Ibu Wahyuni',     'Ayam Potong',    'active',   'Daging & Unggas'],
            ['C-02', 'Bapak Sutrisno',  'Daging Sapi',    'inactive', 'Daging & Unggas'],
            ['D-01', 'Ibu Suwarti',     'Bumbu Masak',    'active',   'Bumbu & Rempah'],
            ['D-02', 'Ibu Munawaroh',   'Rempah-rempah',  'active',   'Bumbu & Rempah'],
            ['E-01', 'Bapak Andi',      'Nasi Rames',     'active',   'Makanan & Minuman'],
            ['E-02', '',                '',               'empty',    'Makanan & Minuman'],
        ];

        foreach ($rejoKios as $k) {
            Kios::updateOrCreate(
                ['pasar_id' => $rejomulyo->id, 'nomor' => $k[0]],
                [
                    'pasar_id'      => $rejomulyo->id,
                    'category_id'   => $createdCats[$k[4]]->id,
                    'nomor'         => $k[0],
                    'nama_pedagang' => $k[1],
                    'komoditas'     => $k[2],
                    'status'        => $k[3],
                ]
            );
        }

        // Sample kios for Klitikan
        $klitikanKios = [
            ['K-01', 'Bapak Agus',      'HP & Aksesoris',  'active',   'Elektronik'],
            ['K-02', 'Bapak Dedi',      'Komputer Bekas',  'active',   'Elektronik'],
            ['K-03', '',                '',                'empty',    'Elektronik'],
            ['K-04', 'Bapak Rudi',      'Sparepart Motor', 'active',   'Elektronik'],
            ['L-01', 'Ibu Lasmi',       'Baju Bekas',      'active',   'Pakaian & Tekstil'],
            ['L-02', 'Ibu Suprapti',    'Kain & Batik',    'active',   'Pakaian & Tekstil'],
            ['L-03', '',                '',                'inactive', 'Pakaian & Tekstil'],
            ['M-01', 'Bapak Heru',      'Perabot Bekas',   'active',   'Barang Bekas'],
            ['M-02', 'Ibu Sri',         'Barang Antik',    'active',   'Barang Bekas'],
            ['M-03', '',                '',                'empty',    'Barang Bekas'],
            ['N-01', 'Bapak Slamet',    'Warung Makan',    'active',   'Makanan & Minuman'],
            ['N-02', 'Ibu Ngatini',     'Minuman & Jus',   'active',   'Makanan & Minuman'],
        ];

        foreach ($klitikanKios as $k) {
            Kios::updateOrCreate(
                ['pasar_id' => $klitikan->id, 'nomor' => $k[0]],
                [
                    'pasar_id'      => $klitikan->id,
                    'category_id'   => $createdCats[$k[4]]->id,
                    'nomor'         => $k[0],
                    'nama_pedagang' => $k[1],
                    'komoditas'     => $k[2],
                    'status'        => $k[3],
                ]
            );
        }
    }
}
