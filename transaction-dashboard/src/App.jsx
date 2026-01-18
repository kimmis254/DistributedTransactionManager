import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API Base URL - This must match your Laravel Server URL
const API_URL = 'http://127.0.0.1:8000/api/v1';

function App() {
  const [nodes, setNodes] = useState(null);
  const [amount, setAmount] = useState(100);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // 1. Polling: Fetch status every 2 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/status`);
      setNodes(res.data);
    } catch (err) {
      console.error("Connection Error (Is Laravel running?)", err);
    }
  };

  const handleTransfer = async () => {
    setLoading(true);
    addLog(`Initiating 2PC Transaction: Transfer $${amount}...`);
    
    try {
      // 2. The Logic: Send request to Coordinator
      const res = await axios.post(`${API_URL}/transfer`, {
        amount: amount,
        simulate_failure: simulateFailure
      });
      addLog(`✅ SUCCESS: ${res.data.message}`);
    } catch (err) {
      // 3. The Integrity Check: Show error if Rollback happened
      const errorMsg = err.response?.data?.message || "Network Error";
      addLog(`❌ FAILED: ${errorMsg}`);
    } finally {
      setLoading(false);
      fetchStatus();
    }
  };

  const handleReset = async () => {
    await axios.post(`${API_URL}/reset`);
    addLog("🔄 System Reset to Defaults.");
    fetchStatus();
  };

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  if (!nodes) return <div className="p-10 text-center text-gray-500">Connecting to Distributed Coordinator...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Distributed Transaction Manager (2PC)</h1>
        <p className="text-gray-600 mb-8">Simulating Atomic Consistency across two decoupled SQLite Nodes.</p>

        {/* NODES VISUALIZATION */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <NodeCard node={nodes.node_a} title="NODE A (New York)" color="bg-blue-100 border-blue-500" />
          <NodeCard node={nodes.node_b} title="NODE B (London)" color="bg-green-100 border-green-500" />
        </div>

        {/* CONTROLS */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">Transaction Controls</h2>
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm p-2 border"
              />
            </div>
            
            <div className="flex items-center h-10">
              <input 
                id="failure" 
                type="checkbox" 
                checked={simulateFailure} 
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="h-4 w-4 text-red-600 border-gray-300 rounded"
              />
              <label htmlFor="failure" className="ml-2 block text-sm text-gray-900 font-bold text-red-600">
                Simulate Network Failure
              </label>
            </div>

            <button 
              onClick={handleTransfer} 
              disabled={loading}
              className={`px-4 py-2 rounded text-white font-bold ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? 'Processing...' : 'Execute Transfer'}
            </button>

            <button onClick={handleReset} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded ml-auto">
              Reset
            </button>
          </div>
        </div>

        {/* SYSTEM LOGS */}
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono h-48 overflow-y-auto">
          {logs.length === 0 && <p className="opacity-50">Waiting for operations...</p>}
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    </div>
  );
}

function NodeCard({ node, title, color }) {
  return (
    <div className={`border-l-4 p-4 rounded shadow-sm bg-white ${color}`}>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Balance:</span>
          <span className="font-mono font-bold text-xl">${node.balance}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Status:</span>
          {node.is_locked ? (
            <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-bold rounded animate-pulse">
              LOCKED (PREPARED)
            </span>
          ) : (
            <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-bold rounded">
              IDLE
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 truncate">
          Lock ID: {node.transaction_id || "None"}
        </div>
      </div>
    </div>
  );
}

export default App;