<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pasar extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'address',
        'latitude', 'longitude', 'thumbnail', 'is_active',
    ];

    protected $casts = [
        'latitude'  => 'float',
        'longitude' => 'float',
        'is_active' => 'boolean',
    ];

    public function kios(): HasMany
    {
        return $this->hasMany(Kios::class);
    }

    public function gisLayers(): HasMany
    {
        return $this->hasMany(GisLayer::class);
    }

    public function getStatsAttribute(): array
    {
        // Use already-loaded relation if available, otherwise load once
        $kios = $this->relationLoaded('kios') ? $this->kios : $this->kios()->get();

        $total    = $kios->count();
        $active   = $kios->where('status', 'active')->count();
        $inactive = $kios->where('status', 'inactive')->count();
        $empty    = $kios->where('status', 'empty')->count();

        return compact('total', 'active', 'inactive', 'empty');
    }
}
