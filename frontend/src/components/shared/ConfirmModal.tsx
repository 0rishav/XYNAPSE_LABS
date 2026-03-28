import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
}: ConfirmModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
          >
            {/* Design Element */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 text-red-500">
                <AlertTriangle size={32} />
              </div>

              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white mb-2 italic">
                {title}
              </h3>
              <p className="text-[11px] font-mono text-slate-500 uppercase leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex gap-4 w-full">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/5 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                >
                  Cancel_
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 px-6 py-4 rounded-2xl bg-red-500 text-white text-[10px] font-black uppercase hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Confirm_Purge"
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
