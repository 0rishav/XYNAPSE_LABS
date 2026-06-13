import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Cpu, 
  Shield, 
  ChevronRight, 
  Activity, 
  Zap
} from "lucide-react";

const HeroSection = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    // FIX 1: bg-white dark:bg-[#05070a] for theme switching
    <section className="relative min-h-screen w-full bg-white dark:bg-[#05070a] flex items-center justify-center overflow-hidden py-20 px-4 transition-colors duration-500">
      
      {/* 1. BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-20 brightness-100 dark:brightness-50" />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" 
          style={{
            transform: `translate(${(mousePos.x - window.innerWidth/2) * 0.02}px, ${(mousePos.y - window.innerHeight/2) * 0.02}px)`
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        
        {/* 2. TEXT CONTENT */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="h-[2px] w-12 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] tracking-[0.5em] uppercase font-bold">
              System_Status: Operational
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl lg:text-[100px] font-black text-slate-900 dark:text-white leading-[0.85] tracking-tighter uppercase mb-8"
          >
            NOT A COURSE. <br />
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600">
              A PROTOCOL.
            </span>
          </motion.h1>

          <motion.p 
            className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-xl font-medium leading-relaxed mb-10 border-l-2 border-slate-200 dark:border-white/10 pl-6"
          >
            Ditch the tutorials. Enter the Upcoding Sandbox. 
            Build production-ready infra and earn your rank in the 
            <span className="text-slate-900 dark:text-white font-bold ml-1">Global Engineering Index.</span>
          </motion.p>

          <div className="flex flex-wrap gap-5">
            <button className="group relative px-8 py-5 bg-emerald-500 text-white dark:text-black font-black text-sm uppercase tracking-widest rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20">
              <span className="relative z-10 flex items-center gap-2">
                Initialize_Lab <ChevronRight size={18} />
              </span>
            </button>

            <button className="px-8 py-5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all backdrop-blur-md">
              Documentation
            </button>
          </div>
        </div>

        {/* 3. VISUAL SIDE (Terminal) */}
        <div className="lg:col-span-5 relative hidden lg:block">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-0 right-0 w-full aspect-square bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:to-black rounded-[3rem] border border-slate-200 dark:border-white/10 p-1 shadow-2xl overflow-hidden group"
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-transparent">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/40" />
                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
              </div>
              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tracking-widest uppercase font-bold">
                Upcoding_Terminal_v4.2
              </div>
            </div>

            {/* Terminal Content */}
            <div className="p-8 font-mono text-xs md:text-sm">
              <div className="flex gap-3 mb-2">
                <span className="text-emerald-500 font-bold">➜</span>
                <span className="text-slate-600 dark:text-slate-300">systemctl status engineering-core</span>
              </div>
              <div className="text-emerald-500 dark:text-emerald-400 mb-6 animate-pulse font-bold">● ACTIVE (RUNNING)</div>
              
              <div className="space-y-4">
                {[
                  { icon: <Cpu size={18} />, label: "CPU_CORE", val: "98.4%", color: "text-cyan-500" },
                  { icon: <Shield size={18} />, label: "SECURITY", val: "ENCRYPTED", color: "text-emerald-500" },
                  { icon: <Activity size={18} />, label: "LATENCY", val: "0.24ms", color: "text-rose-500" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className={item.color}>{item.icon}</div>
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase font-bold">{item.label}</div>
                      <div className="text-slate-900 dark:text-white font-black tracking-widest">{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* Bottom Floating Badge */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -bottom-6 -left-6 p-5 rounded-3xl bg-white dark:bg-black border border-slate-200 dark:border-white/10 shadow-2xl z-20"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                <Zap size={20} fill="currentColor" />
              </div>
              <div>
                <div className="text-slate-900 dark:text-white font-black text-xl leading-none">50+ Labs</div>
                <div className="text-slate-400 text-[9px] font-bold tracking-widest uppercase mt-1">Ready_To_Deploy</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;