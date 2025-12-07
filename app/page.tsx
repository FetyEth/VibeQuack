"use client";
import { useState, useRef, useEffect } from "react";

type Message = { role: string; content: string; type?: "code" | "text" | "report"; rawCode?: string };
type Log = { time: string; action: string; status: "Success" | "Failed" | "Pending" };
type Mode = "architect" | "researcher";

export default function AgentChat() {
  // STATE
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", content: "🦆 QUACK AGENT ONLINE. Connect wallet to start." }
  ]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  
  // SETTINGS
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isMainnet, setIsMainnet] = useState(false);
  const [mode, setMode] = useState<Mode>("architect"); // NEW: Mode Switcher

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // HELPERS
  const addLog = (action: string, status: "Success" | "Failed" | "Pending") => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [{ time, action, status }, ...prev]);
  };

  const getTxPreview = (code: string) => {
    const name = code.match(/string public constant name = "(.*?)";/)?.[1] || "GenToken";
    const symbol = code.match(/string public constant symbol = "(.*?)";/)?.[1] || "GEN";
    return { name, symbol };
  };

  // WALLET
  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        setUserAddress(accounts[0]);
        addLog("Wallet Connect", "Success");
        setMessages(prev => [...prev, { role: "agent", content: `✅ Authenticated: ${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}` }]);
      } catch (err) { alert("Failed to connect wallet."); }
    } else { alert("Please install Metamask."); }
  };

  // API CALLER
  const callAgent = async (action: string, payload: any) => {
    if (!userAddress) {
      setMessages(prev => [...prev, { role: "agent", content: "⚠️ Please connect wallet first." }]);
      return { success: false, error: "No wallet" };
    }
    setLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userAddress, network: isMainnet ? "mainnet" : "testnet", ...payload }),
      });
      const data = await res.json();
      setLoading(false);
      return data;
    } catch (e) {
      setLoading(false);
      return { success: false, error: "Connection Failed" };
    }
  };

  // MAIN HANDLER
  const handleSend = async () => {
    if (!input.trim()) return;
    const prompt = input;
    setMessages(prev => [...prev, { role: "user", content: prompt }]);
    setInput("");

    // --- MODE 1: RESEARCHER ---
    if (mode === "researcher") {
      addLog("Research Query", "Pending");
      const data = await callAgent("research", { prompt });
      if (data.success) {
        addLog("Research Query", "Success");
        setMessages(prev => [...prev, { role: "agent", content: data.result }]);
      } else {
        addLog("Research Query", "Failed");
        setMessages(prev => [...prev, { role: "agent", content: "❌ Research Failed." }]);
      }
      return;
    }

    // --- MODE 2: ARCHITECT (Generate) ---
    addLog("Generate Contract", "Pending");
    const data = await callAgent("generate", { prompt });
    if (data.success) {
      addLog("Generate Contract", "Success");
      setPendingCode(data.code);
      setMessages(prev => [...prev, { 
        role: "agent", type: "code", content: "Contract generated. Review Preview below:", rawCode: data.code 
      }]);
    } else {
      addLog("Generate Contract", "Failed");
      setMessages(prev => [...prev, { role: "agent", content: `❌ Error: ${data.error}` }]);
    }
  };

  const handleAudit = async () => {
    if (!pendingCode) return;
    addLog("Security Audit", "Pending");
    setMessages(prev => [...prev, { role: "user", content: "🛡️ Audit this contract." }]);
    const data = await callAgent("audit", { code: pendingCode });
    if (data.success) {
      addLog("Security Audit", "Success");
      setMessages(prev => [...prev, { role: "agent", type: "report", content: data.report }]);
    }
  };

  const handleDeploy = async () => {
    if (!pendingCode) return;
    const netName = isMainnet ? "MAINNET" : "TESTNET";
    setMessages(prev => [...prev, { role: "user", content: `🚀 Deploy to ${netName}` }]);
    setMessages(prev => [...prev, { role: "agent", content: "🔄 Verifying Quack Policy (Spend Cap < 0.05 BNB)..." }]);
    addLog(`Deploy (${netName})`, "Pending");
    
    const data = await callAgent("deploy", { code: pendingCode });
    if (data.success) {
      addLog(`Deploy (${netName})`, "Success");
      setMessages(prev => [...prev, { role: "agent", content: `✅ DEPLOYED!\n\n📍 Address: ${data.address}\n🔗 BscScan: https://${isMainnet ? "" : "testnet."}bscscan.com/address/${data.address}` }]);
      setPendingCode(null);
    } else {
      addLog(`Deploy (${netName})`, "Failed");
      setMessages(prev => [...prev, { role: "agent", content: `❌ REJECTED: ${data.error}` }]);
    }
  };

  // THEME COLORS
  const mainColor = mode === "architect" ? "green" : "blue";
  const bgColor = mode === "architect" ? "bg-green-900" : "bg-blue-900";
  const borderColor = mode === "architect" ? "border-green-800" : "border-blue-800";
  const textColor = mode === "architect" ? "text-green-400" : "text-blue-400";

  return (
    <div className={`min-h-screen bg-black ${textColor} font-mono p-4 flex gap-4 justify-center transition-colors duration-500`}>
      
      <div className={`w-full max-w-4xl flex flex-col border ${borderColor} rounded-lg p-4 bg-gray-900 bg-opacity-50 shadow-lg transition-all duration-500`}>
        
        {/* HEADER & TABS */}
        <div className={`border-b ${borderColor} pb-3 mb-4`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold tracking-wider">🦆 VIBE QUACK AGENT</span>
              <button onClick={() => setIsMainnet(!isMainnet)} className={`text-[10px] px-2 py-1 rounded text-white font-bold ${isMainnet ? "bg-red-600 animate-pulse" : "bg-gray-700"}`}>
                {isMainnet ? "🔴 MAINNET" : "🟢 TESTNET"}
              </button>
            </div>
            {!userAddress ? (
              <button onClick={connectWallet} className="bg-white text-black px-4 py-1 rounded font-bold text-sm hover:opacity-80">CONNECT WALLET</button>
            ) : (
              <span className="font-bold text-sm font-mono border border-gray-600 px-2 rounded">{userAddress.slice(0,6)}...{userAddress.slice(-4)}</span>
            )}
          </div>

          {/* MODE TABS */}
          <div className="flex gap-2">
            <button 
              onClick={() => setMode("architect")}
              className={`flex-1 py-2 font-bold text-sm rounded transition-all ${mode === "architect" ? "bg-green-700 text-black" : "bg-gray-800 text-gray-500 hover:bg-gray-700"}`}
            >
              🛠️ ARCHITECT (Generate & Deploy)
            </button>
            <button 
              onClick={() => setMode("researcher")}
              className={`flex-1 py-2 font-bold text-sm rounded transition-all ${mode === "researcher" ? "bg-blue-600 text-black" : "bg-gray-800 text-gray-500 hover:bg-gray-700"}`}
            >
              🧠 RESEARCHER (Explain & Analyze)
            </button>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="flex-grow overflow-y-auto space-y-4 pr-2 pb-4 scrollbar-hide h-[60vh]">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] p-3 rounded-lg whitespace-pre-wrap ${m.role === "user" ? `${bgColor} text-white` : "bg-black border border-gray-800"}`}>
                {m.content}
              </div>
              
              {m.type === "code" && m.rawCode && (
                <div className="mt-2 w-[85%] bg-gray-900 border border-gray-700 p-3 rounded text-xs text-gray-300">
                   <div className="mb-4 bg-black border border-gray-800 p-3 rounded">
                      <p className={`${textColor} font-bold border-b border-gray-800 mb-2 pb-1`}>📝 TRANSACTION PREVIEW</p>
                      <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-gray-400">
                         <span>Action:</span> <span className="text-white">DEPLOY CONTRACT</span>
                         <span>Name:</span> <span className="text-white">{getTxPreview(m.rawCode).name}</span>
                         <span>Symbol:</span> <span className="text-white">{getTxPreview(m.rawCode).symbol}</span>
                         <span>Est. Cost:</span> <span className="text-yellow-500">~0.003 BNB (Sponsored)</span>
                      </div>
                   </div>
                   <div className="mt-4 flex gap-3">
                     <button onClick={handleAudit} className="flex-1 bg-yellow-700 hover:bg-yellow-600 text-white py-2 rounded font-bold">🛡️ AUDIT</button>
                     <button onClick={handleDeploy} className="flex-1 bg-red-800 hover:bg-red-600 text-white py-2 rounded font-bold">🚀 DEPLOY</button>
                   </div>
                </div>
              )}
              {m.type === "report" && (
                <div className="mt-2 w-[85%] border-l-4 border-yellow-500 pl-4 bg-yellow-900 bg-opacity-10 p-2 rounded">
                  <p className="text-yellow-500 font-bold mb-2">🛡️ SECURITY AUDIT:</p>
                  <p className="text-xs text-gray-300 mb-4 whitespace-pre-wrap max-h-40 overflow-y-auto">{m.content}</p>
                  <button onClick={handleDeploy} className="bg-green-700 hover:bg-green-600 text-white px-6 py-2 rounded font-bold w-full">✅ APPROVED - DEPLOY</button>
                </div>
              )}
            </div>
          ))}
          {loading && <div className="text-gray-500 animate-pulse">🤖 Agent is thinking...</div>}
          <div ref={scrollRef} />
        </div>

        {/* INPUT */}
        <div className="mt-4 flex gap-2">
          <input
            className={`flex-grow bg-black border ${borderColor} rounded p-3 text-white focus:outline-none`}
            placeholder={mode === "architect" ? "Describe contract to build..." : "Ask about Web3 protocols..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading || !userAddress || !!pendingCode}
          />
          <button onClick={handleSend} disabled={loading || !userAddress || !!pendingCode} className={`bg-white text-black px-8 rounded font-bold hover:opacity-80 disabled:opacity-50`}>SEND</button>
        </div>
      </div>

      {/* ACTIVITY LOG */}
      <div className={`w-80 hidden lg:flex flex-col border ${borderColor} rounded-lg p-4 bg-gray-900 bg-opacity-50 h-fit max-h-[80vh]`}>
         <h3 className="text-lg font-bold border-b border-gray-700 mb-4 pb-2">📜 ACTIVITY LOG</h3>
         <div className="space-y-3 text-xs overflow-y-auto pr-1">
            {logs.map((log, i) => (
               <div key={i} className="flex flex-col border-b border-gray-800 pb-2">
                  <div className="flex justify-between text-gray-500">
                     <span>{log.time}</span>
                     <span className={log.status === "Success" ? "text-green-500" : log.status === "Failed" ? "text-red-500" : "text-yellow-500"}>{log.status}</span>
                  </div>
                  <span className="text-gray-300">{log.action}</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}