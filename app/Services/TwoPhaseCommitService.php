<?php

namespace App\Services;

use App\Models\AccountNodeA;
use App\Models\AccountNodeB;
use Illuminate\Support\Str;
use Exception;
use Illuminate\Support\Facades\Log;

class TwoPhaseCommitService
{
    private $transactionLog = [];

    /**
     * The Main Entry Point.
     * Attempts to move money from Node A (Sender) to Node B (Receiver)
     * using the 2PC Protocol.
     * 
     * @param float $amount
     * @param string $failureScenario 'none', 'node_b_vote', 'ack_timeout_node_a', 'coordinator_crash'
     */
    public function executeTransfer(float $amount, string $failureScenario = 'none')
    {
        // 1. Generate a unique Transaction ID (Traceability)
        $txId = (string) Str::uuid();
        $this->logStep("INIT", "Transaction $txId started.");

        // ====================================================
        // PHASE 1: PREPARE (Voting Phase)
        // ====================================================
        
        try {
            $this->logStep("PREPARE", "Phase 1: Voting Phase Started.");
            
            // Vote 1: Prepare Node A
            $this->logStep("PREPARE", "Asking Node A to Prepare (Lock funds)...");
            $nodeAVote = $this->prepareNodeA($txId, $amount);
            $this->logStep("PREPARE", "Node A Voted: " . ($nodeAVote ? "YES" : "NO"));

            // Vote 2: Prepare Node B
            $this->logStep("PREPARE", "Asking Node B to Prepare (Check status)...");
            // Simulate 'node_b_vote' failure here
            $forceNodeBFail = ($failureScenario === 'node_b_vote');
            $nodeBVote = $this->prepareNodeB($txId, $forceNodeBFail);
            $this->logStep("PREPARE", "Node B Voted: " . ($nodeBVote ? "YES" : "NO"));

            // Check Votes
            if ($nodeAVote && $nodeBVote) {
                // ====================================================
                // PHASE 2: COMMIT (Completion Phase)
                // ====================================================
                
                $this->logStep("DECISION", "All nodes voted YES. Coordinator decides to GLOBALLY COMMIT.");
                
                // SIMULATION: Coordinator Crash
                if ($failureScenario === 'coordinator_crash') {
                    $this->logStep("CRASH", "⚠️ COORDINATOR CRASHED before sending commands! System Halted.");
                    // In a real crash, the process dies here. We throw different exception
                    // to differentiate from a normal rollback scenario in our controller/dashboard.
                    throw new Exception("Coordinator Crashed! Locks are held indefinitely.");
                }

                $this->logStep("COMMIT", "Sending COMMIT command to Node A...");
                $this->commitNodeA($txId, $amount);
                
                // SIMULATION: Ack Timeout Node A
                if ($failureScenario === 'ack_timeout_node_a') {
                     $this->logStep("TIMEOUT", "❌ Ack Timeout: Node A did not acknowledge Commit!");
                     // Proceed anyway, but log the error. Protocol assumes eventually consistent or needs manual check.
                } else {
                    $this->logStep("ACK", "Node A acknowledged COMMIT.");
                }

                $this->logStep("COMMIT", "Sending COMMIT command to Node B...");
                $this->commitNodeB($txId, $amount);
                $this->logStep("ACK", "Node B acknowledged COMMIT.");

                return [
                    'status' => 'success', 
                    'message' => 'Transaction Committed Globally.',
                    'tx_id' => $txId,
                    'transaction_log' => $this->transactionLog
                ];
            } else {
                // One voted NO. We must Abort.
                $this->logStep("DECISION", "One or more nodes voted NO. Coordinator decides to ABORT.");
                throw new Exception("One or more nodes voted NO.");
            }

        } catch (Exception $e) {
            // Check if it was our simulated crash
            if ($e->getMessage() === "Coordinator Crashed! Locks are held indefinitely.") {
                 return [
                    'status' => 'error',
                    'message' => 'CRITICAL: Coordinator Crashed. Transaction is IN DOUBT (Locks held). Needs manual recovery.',
                    'tx_id' => $txId,
                    'transaction_log' => $this->transactionLog,
                    'is_crash' => true
                ];
            }

            // Normal Rollback logic
            Log::error("2PC Transaction Failed: " . $e->getMessage());
            $this->logStep("ROLLBACK", "Phase 2: Global Rollback Started due to error: " . $e->getMessage());
            
            $this->logStep("ROLLBACK", "Sending ROLLBACK command to Node A...");
            $this->rollbackNodeA($txId);
            $this->logStep("ACK", "Node A acknowledged ROLLBACK.");

            $this->logStep("ROLLBACK", "Sending ROLLBACK command to Node B...");
            $this->rollbackNodeB($txId);
            $this->logStep("ACK", "Node B acknowledged ROLLBACK.");

            return [
                'status' => 'error', 
                'message' => 'Transaction Aborted and Rolled Back. Reason: ' . $e->getMessage(),
                'tx_id' => $txId,
                'transaction_log' => $this->transactionLog
            ];
        }
    }

    private function logStep($stage, $message) {
        $entry = sprintf("[%s] %s", $stage, $message);
        Log::info("2PC-TRACE: $entry");
        $this->transactionLog[] = [
            'stage' => $stage,
            'message' => $message,
            'timestamp' => now()->toIso8601String()
        ];
    }

    // ----------------------------------------------------------------
    // INTERNAL HELPER ROUTINES (The "Node Logic")
    // ----------------------------------------------------------------

    private function prepareNodeA($txId, $amount)
    {
        // Logic: Try to lock funds. 
        // We only vote YES if balance is sufficient AND no other transaction is locking it.
        $node = AccountNodeA::first();

        if ($node->balance >= $amount && is_null($node->active_transaction_id)) {
            $node->locked_amount = $amount;
            $node->active_transaction_id = $txId;
            $node->save();
            return true; // VOTE YES
        }
        
        return false; // VOTE NO (Insufficient funds or locked)
    }

    private function prepareNodeB($txId, $simulateFailure)
    {
        if ($simulateFailure) {
            return false; // Artificial Network Crash -> VOTE NO
        }

        $node = AccountNodeB::first();
        
        // Simply lock the row to say "I am part of a transaction"
        if (is_null($node->active_transaction_id)) {
            $node->active_transaction_id = $txId;
            $node->save();
            return true; // VOTE YES
        }

        return false; // VOTE NO (Busy)
    }

    private function commitNodeA($txId, $amount)
    {
        $node = AccountNodeA::where('active_transaction_id', $txId)->first();
        if ($node) {
            // Finalize deduction
            $node->balance -= $node->locked_amount;
            $node->locked_amount = 0;
            $node->active_transaction_id = null; // Release Lock
            $node->save();
        }
    }

    private function commitNodeB($txId, $amount)
    {
        $node = AccountNodeB::where('active_transaction_id', $txId)->first();
        if ($node) {
            // Finalize addition
            $node->balance += $amount;
            $node->active_transaction_id = null; // Release Lock
            $node->save();
        }
    }

    private function rollbackNodeA($txId)
    {
        $node = AccountNodeA::where('active_transaction_id', $txId)->first();
        if ($node) {
            // Revert lock, do NOT deduct money
            $node->locked_amount = 0;
            $node->active_transaction_id = null;
            $node->save();
        }
    }

    private function rollbackNodeB($txId)
    {
        $node = AccountNodeB::where('active_transaction_id', $txId)->first();
        if ($node) {
            // Just release the lock
            $node->active_transaction_id = null;
            $node->save();
        }
    }
}