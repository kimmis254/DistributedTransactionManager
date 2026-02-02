import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// API Base URL
const API_URL = 'http://127.0.0.1:8000/api/v1';

function App() {
  const [nodes, setNodes] = useState(null);
  const [amount, setAmount] = useState(100);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Auto-scroll logs to bottom
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

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
      // FIX: Actually use the 'err' variable
      console.log("Polling error:", err);
    }
  };

  const handleTransfer = async () => {
    setLoading(true);
    // Clear logs for fresh run or keep history? Let's add a separator.
    addLog(`--- New Transaction ---`, 'text-slate-500');
    addLog(`🚀 Initiating 2PC Transaction: Transfer $${amount}...`, 'text-white font-bold');

    try {
      const res = await axios.post(`${API_URL}/transfer`, {
        amount: amount,
        simulate_failure: simulateFailure
      });

      // Process detailed logs from backend
      if (res.data.transaction_log) {
        await processTransactionLogs(res.data.transaction_log);
      }

      addLog(`✅ FINAL: ${res.data.message}`, 'text-green-400 font-bold');

    } catch (err) {
      const errorData = err.response?.data;
      const errorMsg = errorData?.message || "Network Error";

      // Even on failure, we might have logs (partial execution)
      if (errorData?.transaction_log) {
        await processTransactionLogs(errorData.transaction_log);
      }

      addLog(`❌ FINAL: ${errorMsg}`, 'text-red-500 font-bold');
    } finally {
      setLoading(false);
      fetchStatus();
    }
  };

  const processTransactionLogs = async (logs) => {
    for (const log of logs) {
      // Small artificial delay to verify "flow" visualization
      await new Promise(r => setTimeout(r, 600));

      let color = 'text-slate-300';
      if (log.stage === 'PREPARE') color = 'text-yellow-300';
      if (log.stage === 'COMMIT') color = 'text-green-300';
      if (log.stage === 'ROLLBACK') color = 'text-red-300';
      if (log.stage === 'ACK') color = 'text-blue-300';
      if (log.stage === 'DECISION') color = 'text-purple-300 font-bold';

      addLog(`[${log.stage}] ${log.message}`, color);
    }
  };

  const handleReset = async () => {
    await axios.post(`${API_URL}/reset`);
    addLog("🔄 System Reset to Defaults.", 'text-cyan-400');
    fetchStatus();
  };

  const addLog = (msg, className = 'text-slate-300') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, msg, className }]);
  };

  if (!nodes) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-mono">Connecting to Distributed Coordinator...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 pb-2">
            Distributed Transaction Manager
          </h1>
          <p className="text-slate-400 text-lg">
            Two-Phase Commit (2PC) Protocol Simulation
          </p>
        </div>

        {/* NODES DISPLAY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NodeCard
            node={nodes.node_a}
            title="NODE A (Sender)"
            subtitle="New York Server"
            gradient="from-blue-600 to-blue-900"
            icon="🏙️"
          />
          <NodeCard
            node={nodes.node_b}
            title="NODE B (Receiver)"
            subtitle="London Server"
            gradient="from-emerald-600 to-emerald-900"
            icon="🌍"
          />
        </div>

        {/* DASHBOARD CONTROLS */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">

            {/* Input Section */}
            <div className="w-full md:w-auto flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Transfer Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-white font-mono text-lg transition-all"
                />
              </div>
            </div>

            {/* Toggle Section */}
            <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
              </div>
              <span className={`font-bold transition-colors ${simulateFailure ? 'text-red-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                Simulate Failure (Chaos Mode)
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-4 w-full md:w-auto">
              <button
                onClick={handleTransfer}
                disabled={loading}
                className={`flex-1 md:flex-none px-8 py-3 rounded-lg font-bold shadow-lg transform active:scale-95 transition-all ${loading
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/25'
                  }`}
              >
                {loading ? 'Processing...' : 'Execute Transaction'}
              </button>

              <button
                onClick={handleReset}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors border border-slate-600"
                title="Reset System"
              >
                ↻ Reset
              </button>
            </div>
          </div>
        </div>

        {/* TERMINAL LOGS */}
        <div className="bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 font-mono text-sm">
          <div className="bg-slate-900 px-4 py-2 flex items-center gap-2 border-b border-slate-800">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-2 text-slate-500 text-xs">coordinator_logs.txt</span>
          </div>
          <div className="p-4 h-64 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {logs.length === 0 && <p className="text-slate-600 italic">// Waiting for transaction requests...</p>}
            {logs.map((log, i) => (
              <div key={i} className="border-l-2 border-slate-800 pl-3 py-1 hover:bg-slate-900/50 transition-colors font-mono text-xs md:text-sm">
                <span className="text-slate-600 mr-2">[{log.time}]</span>
                <span className="text-emerald-500 mr-2">➜</span>
                <span className={log.className}>
                  {log.msg}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}

// Reusable Fancy Card Component
function NodeCard({ node, title, subtitle, gradient, icon }) {
  const isLocked = node.is_locked;

  return (
    <div className="relative group">
      {/* Glow Effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200`}></div>

      <div className="relative bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl h-full flex flex-col justify-between">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>{icon}</span> {title}
            </h2>
            <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 ${isLocked
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 animate-pulse'
            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
            }`}>
            <span className={`w-2 h-2 rounded-full ${isLocked ? 'bg-yellow-400' : 'bg-emerald-400'}`}></span>
            {isLocked ? 'LOCKED (PREPARED)' : 'IDLE'}
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-700/50">
          <div className="text-slate-500 text-xs uppercase mb-1">Current Balance</div>
          <div className="text-4xl font-mono font-bold text-white tracking-tight">
            ${node.balance.toLocaleString()}
          </div>
        </div>

        <div className="text-xs font-mono text-slate-500 truncate flex items-center gap-2">
          <span>🔒 Lock ID:</span>
          <span className={node.transaction_id ? "text-blue-400" : "text-slate-600"}>
            {node.transaction_id || "None"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;