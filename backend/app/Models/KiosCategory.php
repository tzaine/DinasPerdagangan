<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KiosCategory extends Model
{
    protected $fillable = ['name', 'color_hex', 'icon'];

    public function kios(): HasMany
    {
        return $this->hasMany(Kios::class, 'category_id');
    }
}
