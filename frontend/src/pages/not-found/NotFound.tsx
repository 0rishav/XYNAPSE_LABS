import { motion } from 'framer-motion';
import {  Home, ChevronLeft, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#05070a] flex items-center justify-center p-6 overflow-hidden relative">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

      <div className="max-w-2xl w-full text-center relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative inline-block"
        >
          <h1 className="text-[12rem] md:text-[18rem] font-black leading-none tracking-tighter text-slate-100 dark:text-white/5 select-none">
            404
          </h1>
          <motion.div 
            animate={{ 
              x: [0, -2, 2, -2, 0],
              opacity: [1, 0.8, 1] 
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">
              LOST_NODE
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 space-y-4"
        >
          <div className="flex items-center justify-center gap-2 text-emerald-500 font-mono text-sm tracking-widest uppercase">
            <AlertTriangle size={16} className="animate-pulse" />
            <span>Error_Code: 0x404_NULL_POINTER</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">
            Oops! This segment of the lab doesn't exist.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
            The coordinate you requested is outside our current simulation parameters. Return to base to re-initialize your session.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/">
            <button className="group flex items-center gap-2 px-8 py-4 bg-slate-900 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20">
              <Home size={18} />
              RETURN HOME
            </button>
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-8 py-4 bg-transparent text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
          >
            <ChevronLeft size={18} />
            BACK_TRACE
          </button>
        </motion.div>

        {/* Terminal Simulation Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-20 p-4 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 font-mono text-[10px] text-slate-400 dark:text-slate-600 text-left max-w-sm mx-auto"
        >
          <div className="flex gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-amber-500/50" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
          </div>
          <p>{`> system.request("/${window.location.pathname.split('/').pop()}")`}</p>
          <p className="text-red-500">{`> [ERROR] Node not found in registry.`}</p>
          <p className="animate-pulse">{`> _`}</p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;