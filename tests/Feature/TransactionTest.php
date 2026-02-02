<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\AccountNodeA;
use App\Models\AccountNodeB;

class TransactionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Seed initial state
        AccountNodeA::create([
            'account_name' => 'Node A',
            'balance' => 1000,
            'locked_amount' => 0
        ]);
        
        AccountNodeB::create([
            'account_name' => 'Node B',
            'balance' => 0,
            'locked_amount' => 0
        ]);
    }

    public function test_successful_transfer_returns_logs()
    {
        $response = $this->postJson('/api/v1/transfer', [
            'amount' => 100
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'status',
                     'message',
                     'tx_id',
                     'transaction_log' => [
                         '*' => ['stage', 'message', 'timestamp']
                     ]
                 ]);

        // Verify key log messages exist
        $log = collect($response->json('transaction_log'));
        
        $this->assertTrue($log->contains('stage', 'INIT'));
        $this->assertTrue($log->contains('stage', 'PREPARE'));
        $this->assertTrue($log->contains('stage', 'DECISION'));
        $this->assertTrue($log->contains('stage', 'COMMIT'));
        $this->assertTrue($log->contains('stage', 'ACK'));
        
        $this->assertTrue($log->contains('message', 'All nodes voted YES. Coordinator decides to GLOBALLY COMMIT.'));
    }

    public function test_failed_transfer_returns_logs()
    {
        // Simulate Node B failure
        $response = $this->postJson('/api/v1/transfer', [
            'amount' => 100,
            'simulate_failure' => true
        ]);

        $response->assertStatus(400)
                 ->assertJsonStructure([
                     'status',
                     'message',
                     'tx_id',
                     'transaction_log'
                 ]);

        $log = collect($response->json('transaction_log'));

        $this->assertTrue($log->contains('stage', 'PREPARE'));
        $this->assertTrue($log->contains('stage', 'DECISION'));
        $this->assertTrue($log->contains('stage', 'ROLLBACK'));
        $this->assertTrue($log->contains('stage', 'ACK'));

        $this->assertTrue($log->contains('message', 'One or more nodes voted NO. Coordinator decides to ABORT.'));
    }
}
