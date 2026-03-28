import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers3,
  Zap,
  Bell,
  Wifi,
  Activity,
  Terminal,
  ShieldCheck,
  Globe,
} from "lucide-react";

interface GlobalTopBarProps {
  serverStatus?: "online" | "offline" | "maintenance";
  version?: string;
}

const GlobalTopBar: React.FC<GlobalTopBarProps> = ({
  serverStatus = "online",
  version = "v1.0.0-alpha",
}) => {
  const [latency, setLatency] = useState(24);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * (30 - 18 + 1)) + 18);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = {
    online: "text-emerald-500",
    offline: "text-red-500",
    maintenance: "text-amber-500",
  }[serverStatus];

  const statusBg = {
    online: "bg-emerald-500",
    offline: "bg-red-500",
    maintenance: "bg-amber-500",
  }[serverStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-9 w-full bg-[#f8fafc] dark:bg-[#05070a] border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 md:px-6 z-[60] select-none overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5 opacity-50" />

      {/* LEFT: Branding & Stats */}
      <div className="flex items-center gap-4 text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 z-10">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="relative">
            <Layers3
              size={14}
              className="text-emerald-500 group-hover:rotate-180 transition-transform duration-500"
            />
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`absolute inset-0 ${statusBg} rounded-full blur-sm`}
            />
          </div>
          <span className="font-black text-slate-900 dark:text-white tracking-[0.2em]">
            XYNAPSE
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-4 border-l border-slate-200 dark:border-white/10 pl-4 h-4">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusBg} opacity-75`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${statusBg}`}
              ></span>
            </div>
            <Wifi size={13} className={`${statusColor} animate-pulse`} />
            <span className="uppercase tracking-widest text-[10px]">
              {serverStatus}:{" "}
              <span className={`${statusColor} font-bold`}>STABLE</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-transparent hover:border-amber-500/30 transition-all">
            <Activity size={12} className="text-amber-500" />
            <span className="font-mono">
              PING:{" "}
              <motion.span
                key={latency}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-900 dark:text-slate-200"
              >
                {latency}ms
              </motion.span>
            </span>
          </div>

          {/* SHIELDCHECK ICON - USED HERE FOR SECURITY STATUS */}
          <div className="hidden xl:flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity cursor-help">
            <ShieldCheck size={12} className="text-cyan-500" />
            <span className="text-[9px] tracking-widest font-bold">
              SECURE_TUNNEL
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: Ticker & Actions */}
      <div className="flex items-center gap-4 z-10">
        <div className="hidden md:flex overflow-hidden h-4 items-center border-r border-slate-200 dark:border-white/10 pr-4">
          <motion.p
            animate={{ y: [20, 0, 0, -20] }}
            transition={{
              repeat: Infinity,
              duration: 5,
              times: [0, 0.1, 0.9, 1],
            }}
            className="text-[10px] font-mono text-emerald-500/80"
          >
            &gt; STACK_READY: v1.0.alpha_x64
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-1 hover:text-emerald-500 transition-colors relative group">
            <Bell
              size={14}
              className="dark:text-slate-400 group-hover:animate-bounce"
            />
            <span
              className={`absolute top-0 right-0 w-1.5 h-1.5 ${statusBg} rounded-full`}
            ></span>
          </button>

          <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold">
            <a
              href="#"
              className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all flex items-center gap-1.5"
            >
              <Terminal size={12} className="opacity-80" />
              <span>CONSOLE</span>
            </a>

            <a
              href="#"
              className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all flex items-center gap-1.5"
            >
              <Globe size={12} className="opacity-80" />
              <span>GLOBAL</span>
            </a>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center bg-slate-900 dark:bg-white/5 text-white dark:text-slate-200 px-2 py-0.5 rounded border border-white/10 text-[9px] font-black"
          >
            <Zap size={10} className={`mr-1 fill-current ${statusColor}`} />
            {version.toUpperCase()}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default GlobalTopBar;
