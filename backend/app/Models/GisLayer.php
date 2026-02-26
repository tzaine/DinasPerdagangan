<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GisLayer extends Model
{
    protected $fillable = [
        'pasar_id', 'name', 'type', 'geojson',
        'color', 'opacity', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'opacity'    => 'float',
        'sort_order' => 'integer',
    ];

    public function pasar(): BelongsTo
    {
        return $this->belongsTo(Pasar::class);
    }

    public function getGeojsonDecodedAttribute(): ?array
    {
        return $this->geojson ? json_decode($this->geojson, true) : null;
    }
}
