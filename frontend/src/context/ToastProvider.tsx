import React, { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaTerminal, FaShieldAlt, FaExclamationCircle } from "react-icons/fa";
import type { Toast, ToastType } from "./ToastType";
import { ToastContext } from "./ToastContext";

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: ToastType = "SYSTEM") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-10 right-10 z-[100] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className={`
                group relative overflow-hidden min-w-[320px] p-5 rounded-2xl border backdrop-blur-md transition-all pointer-events-auto
                ${
                  t.type === "SUCCESS"
                    ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    : t.type === "ERROR"
                      ? "bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                      : "bg-slate-900/80 border-white/10 shadow-2xl"
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-lg ${t.type === "SUCCESS" ? "text-emerald-500" : t.type === "ERROR" ? "text-red-500" : "text-white"}`}
                >
                  {t.type === "SUCCESS" ? (
                    <FaShieldAlt size={20} />
                  ) : t.type === "ERROR" ? (
                    <FaExclamationCircle size={20} />
                  ) : (
                    <FaTerminal size={20} />
                  )}
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 dark:text-white">
                    {t.type}_LOG
                  </h4>
                  <p className="text-[11px] font-bold dark:text-slate-200 mt-1 uppercase italic tracking-tighter">
                    {t.message}
                  </p>
                </div>
              </div>
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4 }}
                className={`absolute bottom-0 left-0 h-[2px] ${t.type === "SUCCESS" ? "bg-emerald-500" : t.type === "ERROR" ? "bg-red-500" : "bg-white"}`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
