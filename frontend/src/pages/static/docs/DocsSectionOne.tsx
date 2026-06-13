import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  ChevronRight,
  Layout,
  ShieldCheck,
  Terminal,
  Zap,
  Compass,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const DocsSectionOne = () => {
  const [activeStep, setActiveStep] = useState(0);

  const menuItems = [
    "Introduction",
    "Account Setup",
    "Global Protocol",
    "Security Basics",
  ];

  const onboardingSteps = [
    {
      id: 0,
      title: "Platform Overview",
      subtitle: "The Hyper-Realistic Sandbox",
      desc: "Upcoding Labs isn't just a learning platform; it's a bare-metal simulation engine. We provide a distributed ecosystem where developers can experiment with high-availability systems, global edge networking, and production-grade architectures without worrying about cloud costs.",
      features: [
        "Zero-Latency Linux Terminals",
        "Distributed Node Architecture",
        "Industry-Grade Blueprints",
      ],
      icon: <Compass className="text-emerald-400" />,
      color: "from-emerald-500/20 to-cyan-500/20",
      shadowColor: "shadow-emerald-500/20",
      status: "BOOT_SEQUENCE_COMPLETE",
    },
    {
      id: 1,
      title: "The Theory-Practice Bridge",
      subtitle: "Deep-Dive Implementation",
      desc: "Stop watching, start building. Read architectural deep-dives on React Internals, Fiber Reconciliation, and Database Indexing, then instantly instantiate a pre-configured Lab. Our 'Hot-Sync' technology ensures that your code reflects the concepts you just studied in real-time.",
      features: [
        "React Fiber Visualizer",
        "Instant Lab Instantiation",
        "Live Code Sync",
      ],
      icon: <Layout className="text-blue-400" />,
      color: "from-blue-500/20 to-indigo-500/20",
      shadowColor: "shadow-blue-500/20",
      status: "RUNTIME_SYNC_ACTIVE",
    },
    {
      id: 2,
      title: "Diagnostic Mastery",
      subtitle: "Performance & Monitoring",
      desc: "Engineers don't just code; they debug. Use our integrated Task Manager to monitor CPU spikes, Memory leaks, and Thread execution in real-time. Test your endpoints with our built-in API Suite—a powerful Postman-clone designed for rapid request/response debugging within the lab.",
      features: [
        "Real-time RAM/CPU Monitor",
        "Postman-Clone API Tester",
        "Heapsnapshot Debugger",
      ],
      icon: <Zap className="text-amber-400" />,
      color: "from-amber-500/20 to-orange-500/20",
      shadowColor: "shadow-amber-500/20",
      status: "DIAGNOSTICS_ONLINE",
    },
    {
      id: 3,
      title: "Cloud & DevOps Arena",
      subtitle: "Infra-Level Engineering",
      desc: "Master the art of deployment. Scale Kubernetes clusters, manage Docker registries, and configure Nginx reverse proxies. Our labs provide a safe arena to practice high-stakes maneuvers like Git Rebase, Cherry-picking, and CI/CD pipeline automation under realistic load conditions.",
      features: [
        "K8s Orchestration",
        "Dockerized Environments",
        "Git Flow Sandbox",
      ],
      icon: <Terminal className="text-rose-400" />,
      color: "from-rose-500/20 to-pink-500/20",
      shadowColor: "shadow-rose-500/20",
      status: "INFRA_NODES_READY",
    },
    {
      id: 4,
      title: "Secure Isolation",
      subtitle: "Enterprise Protocol",
      desc: "Security is baked into our core. Every lab session runs in a hardened, isolated micro-container with encrypted SSH access. Our 'State-Persistence' protocol allows you to pause and resume your infrastructure experiments without losing data, protected by enterprise-grade firewalls.",
      features: [
        "Hardened Micro-Containers",
        "State Persistence",
        "SSH-Key Encryption",
      ],
      icon: <ShieldCheck className="text-teal-400" />,
      color: "from-teal-500/20 to-emerald-500/20",
      shadowColor: "shadow-teal-500/20",
      status: "SECURITY_PROTOCOL_v3",
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white dark:bg-[#05070a] transition-colors duration-300">
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-full lg:w-72 border-r border-slate-200 dark:border-white/5 p-6 shrink-0">
        <div className="sticky top-24">
          <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 mb-6 uppercase">
            01. Get_Started
          </h3>
          <nav className="flex flex-col gap-2">
            {menuItems.map((item, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`flex items-center justify-between group px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeStep === i
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-all ${activeStep === i ? "bg-emerald-500 scale-125 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-slate-400"}`}
                  />
                  {item}
                </div>
                <ChevronRight
                  size={14}
                  className={`transition-all ${activeStep === i ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`}
                />
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 p-6 lg:p-12 max-w-5xl">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-8 tracking-widest uppercase">
          <span>Docs</span> <ChevronRight size={10} /> <span>Onboarding</span>{" "}
          <ChevronRight size={10} />{" "}
          <span className="text-emerald-500">{menuItems[activeStep]}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Dynamic Heading based on State */}
            <div className="relative mb-16">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
              <h1 className="text-4xl md:text-6xl font-black dark:text-white tracking-tighter mb-6 uppercase">
                {activeStep === 0 ? "The Upcoding" : menuItems[activeStep]}{" "}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">
                  Protocol Labs
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed max-w-3xl">
                {activeStep === 0
                  ? "You are not just here to watch videos. You are here to engineer. From mastering React internals to debugging Kubernetes clusters, your journey starts now."
                  : `Learn everything about ${menuItems[activeStep]} in this module. We ensure your learning experience is seamless and production-ready.`}
              </p>
            </div>

            <div className="flex flex-col gap-8 mb-24">
              {onboardingSteps
                .filter((step) => step.id === activeStep)
                .map((step) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`group flex flex-col p-10 md:p-14 rounded-[4rem] border border-slate-200 dark:border-white/5 bg-gradient-to-br ${step.color} backdrop-blur-xl relative overflow-hidden shadow-2xl shadow-emerald-500/5`}
                  >
                    <div className="flex justify-between items-start mb-12 relative z-10">
                      <div className="p-6 bg-white dark:bg-black/40 rounded-[2rem] shadow-2xl border border-white/10 text-emerald-500 group-hover:rotate-3 transition-transform duration-500">
                        <div className="scale-[1.5] group-hover:scale-[1.7] transition-transform">
                          {step.icon}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full tracking-[0.2em] border border-emerald-500/20 uppercase animate-pulse">
                          {step.status}
                        </span>
                        <div className="flex gap-1.5">
                          {[...Array(menuItems.length)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === activeStep ? "w-6 bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 flex-grow">
                      <h4 className="text-xs md:text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.5em] mb-4 group-hover:text-emerald-500 transition-colors">
                        {step.subtitle}
                      </h4>
                      <h2 className="text-4xl md:text-6xl font-black dark:text-white mb-8 uppercase italic tracking-tighter leading-[0.9]">
                        {step.title}
                      </h2>
                      <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-12 max-w-4xl">
                        {step.desc}
                      </p>
                    </div>

                    <div className="relative z-10 pt-10 border-t border-slate-200 dark:border-white/10 flex flex-wrap gap-4">
                      {step.features.map((feature, fIdx) => (
                        <span
                          key={fIdx}
                          className="text-xs font-black px-6 py-3 bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-white/10 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/5 transition-all"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  </motion.div>
                ))}
            </div>

            <div className="p-8 rounded-[2.5rem] bg-slate-900 dark:bg-white/5 border border-slate-800 dark:border-white/10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Rocket size={120} className="text-white -rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-4">
                  <Sparkles size={14} /> <span>SYSTEMS_INITIALIZED</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Ready to enter the Lab?
                </h2>
                <div className="flex flex-wrap gap-4">
                  <button className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all group">
                    START LEARNING{" "}
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                  <button className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold border border-white/10 transition-all">
                    <Terminal size={18} /> OPEN TERMINAL
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <aside className="hidden xl:block w-72 p-8 shrink-0 border-l border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-black/20">
        <div className="sticky top-24">
          {/* Header with Scanline effect */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              Navigation_Index
            </h4>
          </div>

          <div className="space-y-6">
            {/* Active Step Progress Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">
                Current Context
              </div>
              <div className="text-xs font-black dark:text-emerald-400 truncate">
                {menuItems[activeStep]}
              </div>
              <div className="mt-3 w-full bg-slate-100 dark:bg-white/5 h-1 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((activeStep + 1) / menuItems.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Modern Anchor Links */}
            <nav className="flex flex-col gap-1">
              {[
                { id: "01", label: "Mission_Brief", target: "#" },
                { id: "02", label: "Core_Features", target: "#" },
                { id: "03", label: "Environment_Check", target: "#" },
              ].map((link, i) => (
                <a
                  key={i}
                  href={link.target}
                  className="group flex items-center gap-3 py-2 text-[11px] font-bold transition-all"
                >
                  <span className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors">
                    {link.id}
                  </span>
                  <span className="text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {link.label}
                  </span>
                  <div className="ml-auto w-1 h-1 rounded-full bg-transparent group-hover:bg-emerald-500 transition-all group-hover:scale-150" />
                </a>
              ))}
            </nav>

            {/* System Quick Stats */}
            <div className="pt-6 border-t border-slate-200 dark:border-white/5">
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mb-2">
                <span>LATENCY</span>
                <span className="text-emerald-500">2.4ms</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                <span>STATUS</span>
                <span className="text-emerald-500">ENCRYPTED</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default DocsSectionOne;
