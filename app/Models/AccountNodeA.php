<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountNodeA extends Model
{
    protected $connection = 'node_a'; // Connects strictly to Node A
    protected $table = 'accounts';
    protected $guarded = [];
}