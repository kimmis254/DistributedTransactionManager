<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountNodeB extends Model
{
    protected $connection = 'node_b'; // Connects strictly to Node B
    protected $table = 'accounts';
    protected $guarded = [];
}