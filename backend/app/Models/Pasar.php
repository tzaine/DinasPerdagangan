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
        $total    = $this->kios()->count();
        $active   = $this->kios()->where('status', 'active')->count();
        $inactive = $this->kios()->where('status', 'inactive')->count();
        $empty    = $this->kios()->where('status', 'empty')->count();

        return compact('total', 'active', 'inactive', 'empty');
    }
}
