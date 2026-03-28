import React from "react";
import { motion } from "framer-motion";
import { 
  Terminal, 
  Cpu, 
  Globe, 
  Zap, 
  ShieldCheck, 
  Boxes
} from "lucide-react";

const features = [
  {
    title: "In-Browser Terminal",
    desc: "No local setup required. Spin up full Linux environments directly in your browser in < 2 seconds.",
    icon: <Terminal className="text-emerald-500" />,
    size: "md:col-span-2",
    bg: "dark:bg-emerald-500/5 bg-emerald-50",
  },
  {
    title: "Zero-Trust Security",
    desc: "Learn hardening by breaking. Real-world security scenarios in isolated sandboxes.",
    icon: <ShieldCheck className="text-rose-500" />,
    size: "md:col-span-1",
    bg: "dark:bg-rose-500/5 bg-rose-50",
  },
  {
    title: "Edge Deployments",
    desc: "Deploy your projects to our global edge network and see them live instantly.",
    icon: <Globe className="text-blue-500" />,
    size: "md:col-span-1",
    bg: "dark:bg-blue-500/5 bg-blue-50",
  },
  {
    title: "Real-time Debugging",
    desc: "Our AI-powered debugger watches your code and suggests fixes as you build.",
    icon: <Cpu className="text-purple-500" />,
    size: "md:col-span-2",
    bg: "dark:bg-purple-500/5 bg-purple-50",
  },
];

const FeatureSection = () => {
  return (
    <section className="py-24 bg-white dark:bg-[#05070a] px-6 relative overflow-hidden">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%2394a3b8' fill-rule='evenodd'/%3E%3C/svg%3E")` }} 
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-6"
          >
            <Boxes size={12} />
            System_Capabilities
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Engineered for <span className="text-emerald-500">Performance</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`group relative p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 overflow-hidden transition-all ${feature.bg} ${feature.size}`}
            >
              {/* Abstract Icon Backdrop */}
              <div className="absolute -right-8 -bottom-8 opacity-[0.03] dark:opacity-[0.07] group-hover:scale-150 transition-transform duration-700">
                {React.cloneElement(feature.icon as React.ReactElement, { size: 180 })}
              </div>

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-black/50 shadow-sm flex items-center justify-center mb-6 group-hover:shadow-emerald-500/20 transition-all">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm">
                    {feature.desc}
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">
                  Learn_More <Zap size={10} fill="currentColor" />
                </div>
              </div>

              {/* Scanline Effect (Retro Terminal Style) */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-transparent h-[200%] w-full animate-scanline opacity-0 group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;