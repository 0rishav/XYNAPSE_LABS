import { motion } from "framer-motion";
import { Rocket, ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-24 bg-white dark:bg-[#05070a] px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="relative bg-slate-900 dark:bg-white/[0.02] border border-white/10 rounded-[3rem] p-8 md:p-16 text-center overflow-hidden"
        >
          {/* Animated Border/Edge Light */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_4s_infinite] pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] mb-8">
              <Rocket size={14} className="animate-bounce" />
              Ready_for_deployment?
            </div>

            <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-[0.9] mb-8">
              Stop Watching. <br />
              <span className="text-emerald-500">Start Building.</span>
            </h2>

            <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium mb-12 leading-relaxed">
              Join 10,000+ engineers mastering DevOps, Cloud, and Cybersecurity through 
              hands-on missions. No slides, just <span className="text-white font-bold">Pure Execution.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button className="group relative px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden">
                <span className="relative z-10">Initialize Account</span>
                <ArrowRight size={20} className="relative z-10 group-hover:translate-x-2 transition-transform" />
                {/* Button Shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>

              <button className="px-10 py-5 bg-transparent border border-white/10 hover:bg-white/5 text-white font-black uppercase tracking-widest rounded-2xl transition-all">
                View Curriculum
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-16 pt-12 border-t border-white/5 grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center gap-2">
                <Users size={20} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">10K+ Operatives</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enterprise Ready</span>
              </div>
              <div className="hidden md:flex flex-col items-center gap-2">
                <Zap size={20} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Instant Labs</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;