import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, Sparkles, Terminal } from "lucide-react";

const BlogHero = () => {
  return (
    <section className="relative w-full pt-20 pb-10 px-6 lg:px-12 overflow-hidden bg-white dark:bg-[#05070a]">
      {/* Background Glows - Cinematic Touch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Section Label */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 mb-8"
        >
          <div className="w-8 h-[1px] bg-emerald-500" />
          <span className="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase">
            Featured_Journal_v1.0
          </span>
        </motion.div>

        {/* Hero Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-5xl md:text-7xl font-black dark:text-white tracking-tighter leading-[0.85] uppercase italic">
                Architecting <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">
                  Global Edge
                </span>{" "}
                <br />
                Networks.
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed font-medium"
            >
              Deep dive into how Upcoding Labs manages high-availability clusters
              across 14 global regions with sub-5ms latency protocols.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-6 pt-4"
            >
              <button className="group relative flex items-center gap-3 px-8 py-4 bg-slate-900 text-white dark:bg-emerald-500 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/20">
                READ FULL CASE STUDY
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>

              <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} /> JAN 27, 2026
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-800" />
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> 12 MIN READ
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right: Abstract Tech Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative z-10 p-2 rounded-[3rem] bg-gradient-to-br from-slate-200 to-white dark:from-white/10 dark:to-transparent border border-slate-200 dark:border-white/5 shadow-2xl">
              <div className="relative overflow-hidden rounded-[2.5rem] aspect-square bg-slate-900 flex items-center justify-center group">
                {/* Simulated Terminal UI inside Image Area */}
                <div className="absolute inset-0 p-8 font-mono text-[10px] text-emerald-500/40 select-none">
                  <p>{`> initialising_core_node...`}</p>
                  <p>{`> mounting_distributed_fs... [OK]`}</p>
                  <p>{`> security_protocol_active: true`}</p>
                  <p>{`> load_balancer_sync: 99.9%`}</p>
                </div>

                <Terminal
                  size={120}
                  className="text-emerald-500 group-hover:scale-110 transition-transform duration-700 opacity-80"
                />

                {/* Floating Badge */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      Priority_Node
                    </p>
                    <p className="text-white font-bold">Upcoding-Alpha-01</p>
                  </div>
                  <Sparkles className="text-emerald-400" size={20} />
                </div>
              </div>
            </div>

            {/* Background Decorative Rings */}
            <div className="absolute -top-10 -right-10 w-32 h-32 border-2 border-emerald-500/20 rounded-full animate-ping" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 border border-cyan-500/20 rounded-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BlogHero;
