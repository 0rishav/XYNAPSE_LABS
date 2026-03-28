import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  fileName?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = "bash", fileName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-[#0d1117] shadow-2xl">
      {/* --- TERMINAL HEADER --- */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10">
            <Terminal size={12} className="text-emerald-500" />
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {fileName || (language === 'bash' ? 'terminal.sh' : 'source_code')}
            </span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-slate-500 hover:text-emerald-500"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* --- CODE CONTENT --- */}
      <div className="p-6 overflow-x-auto custom-scrollbar">
        <pre className="font-mono text-sm leading-relaxed text-slate-300">
          <code className={`language-${language}`}>
            {code.split('\n').map((line, i) => (
              <div key={i} className="table-row">
                <span className="table-cell pr-4 text-slate-600 select-none text-right text-[10px] w-8">
                  {i + 1}
                </span>
                <span className="table-cell">
                  {line || " "}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* --- GLOW EFFECT (DARK MODE ONLY) --- */}
      <div className="absolute inset-0 pointer-events-none border border-emerald-500/0 group-hover:border-emerald-500/20 transition-colors duration-500 rounded-2xl" />
    </div>
  );
};

export default CodeBlock;