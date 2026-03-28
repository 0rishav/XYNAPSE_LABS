import { Shield, Cpu, Globe, ArrowUpRight } from "lucide-react";

const BlogArchive = () => {
  return (
    <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-slate-100 dark:border-white/5">
      {/* Section Header */}
      <div className="mb-12">
        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-2">
          System_Archives
        </h4>
        <h2 className="text-4xl font-black dark:text-white uppercase italic tracking-tighter">
          Past_Logs & Research.
        </h2>
      </div>

      {/* 3-Column Static Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Card 1: Security */}
        <div className="group p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 transition-all duration-500">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-black/40 flex items-center justify-center text-emerald-500 mb-6 group-hover:rotate-12 transition-transform">
            <Shield size={24} />
          </div>
          <h3 className="text-xl font-black dark:text-white mb-3 uppercase tracking-tighter italic">
            Hardening SSH Access
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            Implementing multi-factor authentication for isolated lab
            environments using custom PAM modules.
          </p>
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Feb 12, 2026
            </span>
            <ArrowUpRight
              size={16}
              className="text-slate-300 group-hover:text-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Card 2: Performance */}
        <div className="group p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-cyan-500/50 transition-all duration-500">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-black/40 flex items-center justify-center text-cyan-500 mb-6 group-hover:rotate-12 transition-transform">
            <Cpu size={24} />
          </div>
          <h3 className="text-xl font-black dark:text-white mb-3 uppercase tracking-tighter italic">
            V8 Engine Optimization
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            How we reduced memory overhead by 40% during large-scale React tree
            reconciliations.
          </p>
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Jan 30, 2026
            </span>
            <ArrowUpRight
              size={16}
              className="text-slate-300 group-hover:text-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Card 3: Network */}
        <div className="group p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-amber-500/50 transition-all duration-500">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-black/40 flex items-center justify-center text-amber-500 mb-6 group-hover:rotate-12 transition-transform">
            <Globe size={24} />
          </div>
          <h3 className="text-xl font-black dark:text-white mb-3 uppercase tracking-tighter italic">
            Geo-DNS Routing
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            Latency-based routing strategies for distributing lab traffic across
            multi-cloud regions.
          </p>
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Jan 15, 2026
            </span>
            <ArrowUpRight
              size={16}
              className="text-slate-300 group-hover:text-amber-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogArchive;
