<?php

namespace App\Models;

use App\Models\KiosCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Kios extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'pasar_id', 'category_id', 'nomor', 'nama_pedagang',
        'komoditas', 'status', 'luas', 'geometry', 'keterangan',
    ];

    protected $casts = [
        'geometry' => 'array',
        'luas'     => 'float',
    ];

    public function pasar(): BelongsTo
    {
        return $this->belongsTo(Pasar::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(KiosCategory::class, 'category_id');
    }
}
