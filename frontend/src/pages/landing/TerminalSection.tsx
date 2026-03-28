import React, { useState, useEffect } from "react";
import { Terminal, Shield, Globe, Cpu, CheckCircle2 } from "lucide-react";

const TerminalSection = () => {
  const [activeLine, setActiveLine] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const terminalSteps = [
    "> initializing_xynapse_kernel...",
    "> establishing_zero_trust_handshake...",
    "> pulling_container_image: alpine-node-v22",
    "> mounting_virtual_volumes...",
    "> port_forwarding: 8080 -> 443",
    "> status: system_online_and_secure",
    "> ready_for_deployment_mission_01",
  ];

  useEffect(() => {
    // Agar saari lines print ho chuki hain
    if (activeLine >= terminalSteps.length) {
      const resetTimeout = setTimeout(() => {
        setLogs([]);
        setActiveLine(0);
      }, 3000); // 3 second wait karega restart karne se pehle
      return () => clearTimeout(resetTimeout);
    }

    // Normal typing logic
    const typingTimeout = setTimeout(() => {
      setLogs((prev) => [...prev, terminalSteps[activeLine]]);
      setActiveLine((prev) => prev + 1);
    }, 800);

    return () => clearTimeout(typingTimeout);
  }, [activeLine]); // activeLine change hote hi effect trigger hoga

  return (
    <section className="py-24 bg-slate-50 dark:bg-[#020408] relative overflow-hidden transition-colors duration-500">
      {/* Background Tech Mesh - Fixed dark mode detection for inline style */}
      <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.3] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left Side: Content (Same as before) */}
        <div>
          <div className="flex items-center gap-2 text-emerald-500 font-mono text-[10px] tracking-[0.4em] uppercase mb-6">
            <Cpu size={14} />
            Execution_Environment
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic mb-8">
            Real Labs. <br />
            <span className="text-emerald-500">Zero Setup.</span>
          </h2>

          <div className="space-y-6">
            {[
              { icon: <Shield size={18} />, title: "Isolated Sandboxes", desc: "Every mission runs in a dedicated, secure kernel." },
              { icon: <Globe size={18} />, title: "Global Latency", desc: "Edge-computed labs for lag-free terminal experience." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="mt-1 w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Interactive Terminal */}
        <div className="relative">
          <div className="w-full bg-[#0d1117] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transform lg:rotate-2 hover:rotate-0 transition-transform duration-700">
            <div className="bg-[#161b22] px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <Terminal size={12} /> root@xynapse:~
              </div>
            </div>

            <div className="p-6 font-mono text-sm min-h-[350px] flex flex-col gap-2">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-emerald-500">➜</span>
                  <span className={`${i === logs.length - 1 ? "text-white" : "text-slate-400"} transition-colors`}>
                    {log}
                  </span>
                  {/* Status Check Icon for successful lines */}
                  {(log.includes("online") || log.includes("ready")) && (
                    <CheckCircle2 size={14} className="text-emerald-500 animate-pulse mt-1" />
                  )}
                </div>
              ))}
              
              {/* Blinking Cursor - only shows when not waiting for reset */}
              {activeLine < terminalSteps.length && (
                <div className="flex gap-3 items-center">
                  <span className="text-emerald-500 font-bold">➜</span>
                  <div className="w-2 h-4 bg-emerald-500 animate-pulse" />
                </div>
              )}
            </div>

            <div className="bg-[#161b22]/50 px-6 py-2 flex items-center gap-6 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] text-slate-500 font-bold uppercase">Mainnet_Online</span>
              </div>
              <span className="text-[10px] text-slate-600 font-mono">CPU: {Math.floor(Math.random() * 10) + 5}%</span>
              <span className="text-[10px] text-slate-600 font-mono">RAM: 1.2GB</span>
            </div>
          </div>

          {/* Floating Code Badge */}
          <div className="absolute -bottom-6 -left-10 bg-white dark:bg-emerald-500 p-4 rounded-xl shadow-xl hidden md:block border border-slate-100 dark:border-none rotate-[-5deg] transition-all group-hover:rotate-0">
            <pre className="text-[10px] font-black dark:text-slate-900 text-emerald-600">
              {`docker build -t xynapse-v1 .
Successfully built a1b2c3d4
Pushing to edge...`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TerminalSection;