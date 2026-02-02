<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\TwoPhaseCommitService;
use App\Models\AccountNodeA;
use App\Models\AccountNodeB;

class TransactionController extends Controller
{
    protected $coordinator;

    // Inject the Coordinator Service we created in Phase 5
    public function __construct(TwoPhaseCommitService $coordinator)
    {
        $this->coordinator = $coordinator;
    }

    /**
     * Endpoint to initiate a Distributed Transaction.
     * POST /api/transfer
     */
    public function transfer(Request $request)
    {
        // 1. Validate Input
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'failure_scenario' => 'nullable|string|in:none,node_b_vote,ack_timeout_node_a,coordinator_crash',
            'simulate_failure' => 'boolean' // Legacy support
        ]);

        $amount = (float) $request->input('amount');
        
        // Determine scenario: Prefer specific enum, fall back to boolean flag
        $scenario = $request->input('failure_scenario');
        if (!$scenario) {
            $scenario = $request->input('simulate_failure', false) ? 'node_b_vote' : 'none';
        }

        // 2. Execute the 2PC Protocol via the Service
        $result = $this->coordinator->executeTransfer($amount, $scenario);

        // 3. Return JSON response
        if ($result['status'] === 'success') {
            return response()->json($result, 200);
        } else {
            return response()->json($result, 400); // 400 Bad Request if transaction aborted
        }
    }

    /**
     * Endpoint to get current state of the distributed system.
     * GET /api/status
     */
    public function status()
    {
        // Fetch fresh data from both distinct databases
        $nodeA = AccountNodeA::first();
        $nodeB = AccountNodeB::first();

        return response()->json([
            'node_a' => [
                'name' => $nodeA->account_name,
                'balance' => $nodeA->balance,
                'locked_amount' => $nodeA->locked_amount,
                'is_locked' => !is_null($nodeA->active_transaction_id),
                'transaction_id' => $nodeA->active_transaction_id
            ],
            'node_b' => [
                'name' => $nodeB->account_name,
                'balance' => $nodeB->balance,
                'is_locked' => !is_null($nodeB->active_transaction_id),
                'transaction_id' => $nodeB->active_transaction_id
            ]
        ]);
    }
    
    /**
     * Helper to reset balances (Good for testing demos)
     * POST /api/reset
     */
    public function reset()
    {
        // Reset Node A
        AccountNodeA::truncate();
        AccountNodeA::create([
            'account_name' => 'Main Branch (Sender)',
            'balance' => 1000.00,
            'locked_amount' => 0
        ]);

        // Reset Node B
        AccountNodeB::truncate();
        AccountNodeB::create([
            'account_name' => 'Remote Branch (Receiver)',
            'balance' => 0.00,
            'locked_amount' => 0
        ]);

        return response()->json(['message' => 'System Reset Successfully']);
    }
}