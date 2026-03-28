import React from "react";
import { ArrowRight, BookOpen, Hash, Terminal } from "lucide-react";

const StaticBlog = () => {
  return (
    <div className="bg-white dark:bg-[#05070a] py-20 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* LEFT: MAIN CONTENT AREA */}
        <div className="lg:col-span-8 space-y-16">
          
          {/* Static Article 1 */}
          <article className="group border-b border-slate-100 dark:border-white/5 pb-16">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">
                <Terminal size={12} /> Environment_Setup / Mar 2026
              </div>
              <h2 className="text-4xl font-black dark:text-white uppercase italic tracking-tighter leading-none group-hover:text-emerald-500 transition-colors">
                The Hardened <br /> Micro-Container Protocol.
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-2xl">
                Every lab session at Xynapse runs in a strictly isolated gVisor runtime. 
                We don't just provide a terminal; we provide a production-grade sandbox 
                that mimics bare-metal performance.
              </p>
              <div className="flex items-center gap-6 pt-4">
                <button className="text-xs font-black dark:text-white flex items-center gap-2 group-hover:gap-4 transition-all">
                  READ ARCHIVE <ArrowRight size={16} className="text-emerald-500" />
                </button>
                <span className="text-[10px] font-bold text-slate-400">12 MIN READ</span>
              </div>
            </div>
          </article>

          {/* Static Article 2 */}
          <article className="group border-b border-slate-100 dark:border-white/5 pb-16">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em]">
                <Hash size={12} /> Network_Engineering / Feb 2026
              </div>
              <h2 className="text-4xl font-black dark:text-white uppercase italic tracking-tighter leading-none group-hover:text-cyan-500 transition-colors">
                Zero-Latency <br /> Edge Synchronization.
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-2xl">
                Managing state persistence across 14 global regions. Our "Hot-Sync" 
                technology ensures your code is always where you are, regardless of 
                the physical node location.
              </p>
              <div className="flex items-center gap-6 pt-4">
                <button className="text-xs font-black dark:text-white flex items-center gap-2 group-hover:gap-4 transition-all">
                  READ ARCHIVE <ArrowRight size={16} className="text-cyan-500" />
                </button>
                <span className="text-[10px] font-bold text-slate-400">08 MIN READ</span>
              </div>
            </div>
          </article>

        </div>

        {/* RIGHT: STATIC SIDEBAR */}
        <aside className="lg:col-span-4 space-y-12">
          {/* Static Info Box */}
          <div className="p-10 rounded-[3rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 relative overflow-hidden">
            <h4 className="text-sm font-black dark:text-white mb-4 uppercase tracking-widest">The_Log_Book</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
              Technical documentations, research papers, and system updates from the Xynapse Engineering team.
            </p>
            <ul className="space-y-4">
              {['System_Health: 99.9%', 'Nodes_Active: 1,024', 'Protocol: v3.11'].map((stat, i) => (
                <li key={i} className="text-[10px] font-mono text-emerald-500 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {stat}
                </li>
              ))}
            </ul>
          </div>

          {/* Join Discord/Newsletter Static */}
          <div className="p-10 rounded-[3rem] bg-slate-900 text-white shadow-2xl shadow-emerald-500/10">
            <h4 className="text-2xl font-black mb-4 uppercase italic tracking-tighter">Enter the Lab</h4>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              Get notified when new simulation blueprints are released.
            </p>
            <div className="space-y-3">
              <div className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold text-slate-500">
                system@xynapse.sh_
              </div>
              <button className="w-full py-4 bg-emerald-500 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-colors">
                INITIALIZE_SUBSCRIBE
              </button>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default StaticBlog;