import { motion } from "framer-motion";
import { Terminal, BookOpen, ArrowRight, CornerDownLeft } from "lucide-react";
import { Link } from "react-router-dom";

const BlogFooterCTA = () => {
  return (
    <footer className="w-full bg-white dark:bg-[#05070a] pt-10 pb-20 px-6 lg:px-12 border-t border-slate-100 dark:border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="relative z-10 p-12 lg:p-16 rounded-[4rem] bg-slate-950 dark:bg-black/40 border border-slate-800 dark:border-white/5 shadow-2xl shadow-emerald-500/10 overflow-hidden flex flex-col md:flex-row items-center gap-12"
        >
          <div className="flex-grow space-y-8 max-w-2xl">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-8 rounded-3xl bg-slate-900 dark:bg-black/60 border border-slate-800 dark:border-white/5 font-mono text-sm shadow-xl"
            >
              <div className="flex gap-1.5 mb-6 pb-4 border-b border-slate-800">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <p className="text-slate-500">{`guest@xynapse:~# sudo protocol_v4 --initialize`}</p>
              <p className="text-white mt-2 flex gap-2 items-center">
                <span className="text-emerald-400 font-bold">XYN_INIT_OK:</span>{" "}
                Simulation Nodes Standing By.{" "}
                <CornerDownLeft
                  size={16}
                  className="text-slate-600 animate-pulse"
                />
              </p>
              <p className="text-slate-600 mt-2">{`Enter simulation node Alpha_Zero_Zero_One [y/n]?`}</p>
              <p className="text-cyan-400 mt-2 animate-pulse">{`>_`}</p>
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-black text-white leading-[0.9] uppercase italic tracking-tighter max-w-lg">
              Terminate Theory. <br /> Initialize Implementation.
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-4 w-full md:w-auto shrink-0 relative z-20">
            <button className="group flex items-center justify-center gap-3 px-10 py-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20">
              <Terminal size={18} />
              ENTER THE LABS
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>

            <Link to={"/docs"}>
              <button className="group flex items-center justify-center gap-3 px-10 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-[13px] uppercase tracking-widest transition-all">
                <BookOpen size={18} className="text-cyan-400" />
                EXPLORE_DOCS
              </button>
            </Link>
          </div>

          <Terminal
            size={400}
            className="absolute -bottom-20 -right-20 text-emerald-500/5 rotate-12 -z-0 pointer-events-none"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 flex flex-col sm:flex-row items-center justify-between gap-6 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] border-t border-slate-100 dark:border-white/5 pt-8"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Terminal size={14} />
            </div>
            &copy; 2026 Xynapse Labs. Core_Systems_Isolated.
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-emerald-500 transition-colors">
              Privacy_Protocol
            </a>
            <a href="#" className="hover:text-emerald-500 transition-colors">
              Security_Audits
            </a>
            <a href="#" className="hover:text-cyan-500 transition-colors">
              Status: Operational
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default BlogFooterCTA;
