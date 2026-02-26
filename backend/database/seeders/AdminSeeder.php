<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@dinsemarang.go.id'],
            [
                'name'     => 'Admin Dinas Perdagangan',
                'email'    => 'admin@dinsemarang.go.id',
                'password' => Hash::make('password'),
                'role'     => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'staff@dinsemarang.go.id'],
            [
                'name'     => 'Staff Pasar',
                'email'    => 'staff@dinsemarang.go.id',
                'password' => Hash::make('password'),
                'role'     => 'staff',
            ]
        );
    }
}
