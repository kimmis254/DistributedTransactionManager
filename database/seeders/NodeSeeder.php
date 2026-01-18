<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AccountNodeA;
use App\Models\AccountNodeB;
use Illuminate\Support\Facades\DB;

class NodeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Seed Node A (The Sender)
        AccountNodeA::truncate();
        AccountNodeA::create([
            'account_name' => 'Main Branch (Sender)',
            'balance' => 1000.00,
            'locked_amount' => 0,
            'active_transaction_id' => null
        ]);

        // Seed Node B (The Receiver)
        AccountNodeB::truncate();
        AccountNodeB::create([
            'account_name' => 'Remote Branch (Receiver)',
            'balance' => 0.00,
            'locked_amount' => 0,
            'active_transaction_id' => null
        ]);
        
        $this->command->info('Nodes seeded successfully!');
    }
}