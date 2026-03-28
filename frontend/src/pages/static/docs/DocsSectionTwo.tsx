import React from "react";
import { motion } from "framer-motion";
import {
  Server,
  Cloud,
  Layout,
  Terminal,
  Activity,
  Layers,
  Cpu,
  Database,
  Box,
  GitBranch,
  Code2,
} from "lucide-react";

const DocsSectionTwo = () => {
  const labs = [
    {
      id: "frontend",
      title: "Frontend Runtimes",
      desc: "Practice React, Next.js, Vue, and Angular with a real-time hot-reloading compiler.",
      icon: <Layout className="text-cyan-500" />, // USED
      tags: ["React", "Next.js", "Vue", "Angular"],
      color: "border-cyan-500/20 bg-cyan-500/5",
    },
    {
      id: "backend",
      title: "Backend Frameworks",
      desc: "Spin up Node.js, Django, or Spring Boot servers with inbuilt Postman-like API testing tools.",
      icon: <Server className="text-emerald-500" />, // USED
      tags: ["Node.js", "Django", "Spring Boot", "API Test"],
      color: "border-emerald-500/20 bg-emerald-500/5",
    },
    {
      id: "cloud",
      title: "Cloud & Infrastructure",
      desc: "Master Docker, K8s, and CI/CD pipelines. Practice Git rebase and branching strategies.",
      icon: <Cloud className="text-blue-500" />, // USED
      tags: ["Docker", "K8s", "Git", "CI/CD"],
      color: "border-blue-500/20 bg-blue-500/5",
    },
    {
      id: "ai-ml",
      title: "LLM & AI Labs",
      desc: "Specialized environments for AI/ML practice problems and LLM fine-tuning simulations.",
      icon: <Cpu className="text-purple-500" />, // USED (Cpu used for AI)
      tags: ["LLM", "AI/ML", "Python", "Models"],
      color: "border-purple-500/20 bg-purple-500/5",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#05070a] p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-[10px] tracking-[0.3em] uppercase mb-3">
            <Layers size={14} />THE_PRACTICAL_CORE
          </div>
          <h1 className="text-4xl md:text-5xl font-black dark:text-white tracking-tighter mb-4">
            HYPER-REALISTIC <span className="text-rose-500">LABS</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl leading-relaxed">
            From <b>Frontend compilers</b> to <b>Cloud pipelines</b>, every
            concept is backed by a dedicated sandbox.
          </p>
        </div>

        {/* Labs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {labs.map((lab, i) => (
            <motion.div
              key={lab.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-[2rem] border ${lab.color} backdrop-blur-xl relative overflow-hidden group cursor-pointer hover:border-white/20 transition-all`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-white dark:bg-black/40 shadow-xl group-hover:rotate-6 transition-transform">
                  {lab.icon}
                </div>
                {/* Visual Indicators - Using Box and Code2 here */}
                <div className="flex gap-2 text-slate-400">
                  <Box size={14} />
                  <Code2 size={14} />
                </div>
              </div>
              <h3 className="text-2xl font-black dark:text-white mb-3 uppercase tracking-tight">
                {lab.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                {lab.desc}
              </p>
              <div className="flex flex-wrap gap-2">
                {lab.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Diagnostic Tools Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Monitor - Using Activity and Database */}
          <div className="lg:col-span-2 p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500">
                <Activity size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">
                  System Diagnostics
                </h4>
                <p className="text-slate-400 text-[10px] tracking-widest uppercase">
                  Live Thread Monitoring
                </p>
              </div>
              <Database size={18} className="ml-auto text-slate-700" />{" "}
              {/* Database icon used here */}
            </div>
            <div className="flex gap-4">
              <div className="h-20 flex-1 rounded-xl bg-white/5 border border-white/5 p-4 relative overflow-hidden">
                <div className="text-[10px] text-slate-500 font-mono">
                  CPU_CORE_THREADS
                </div>
                <div className="text-xl font-black text-emerald-500 mt-1 uppercase">
                  Stable
                </div>
              </div>
              <div className="h-20 flex-1 rounded-xl bg-white/5 border border-white/5 p-4">
                <div className="text-[10px] text-slate-500 font-mono">
                  MEMORY_SWAP
                </div>
                <div className="text-xl font-black text-cyan-500 mt-1 uppercase">
                  Optimized
                </div>
              </div>
            </div>
          </div>

          {/* Git/Terminal Card - Using Terminal and GitBranch */}
          <div className="p-8 rounded-[2.5rem] bg-emerald-500 flex flex-col justify-between group cursor-pointer relative">
            <GitBranch
              size={40}
              className="absolute top-6 right-6 opacity-20 text-black rotate-12"
            />{" "}
            {/* GitBranch used here */}
            <div className="h-14 w-14 rounded-2xl bg-black flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform">
              <Terminal size={24} />
            </div>
            <div>
              <h4 className="text-black font-black text-2xl leading-none mb-2 uppercase italic">
                Shell Mastery
              </h4>
              <p className="text-black/70 text-sm font-medium leading-tight">
                Master Git rebase and Linux kernels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsSectionTwo;
