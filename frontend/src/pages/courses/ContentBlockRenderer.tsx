import React from "react";
import { Hash, Quote as QuoteIcon } from "lucide-react";
import CodeBlock from "./CodeBlock";

interface ContentBlockProps {
  block: {
    type: string;
    data: any;
  };
}

const ContentBlockRenderer: React.FC<ContentBlockProps> = ({ block }) => {
  if (!block || !block.data) return null;

  const { type, data } = block;

  switch (type) {
    case "heading": { 
      const levels: Record<number, string> = {
        2: "text-3xl font-black text-slate-900 dark:text-white mt-12 mb-6 uppercase italic tracking-tighter border-l-4 border-emerald-500 pl-5",
        3: "text-xl font-bold text-emerald-500 mt-8 mb-4 uppercase tracking-widest",
        4: "text-lg font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2 underline decoration-emerald-500/30",
      };
      const Tag = `h${data.level || 2}` as keyof JSX.IntrinsicElements;
      return <Tag className={levels[data.level as number] || levels[2]}>{data.text}/</Tag>;
    } 

    case "paragraph":
      return (
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-medium">
          {data.text}
        </p>
      );

    case "code":
      return (
        <div className="my-8">
          <CodeBlock
            code={data.code}
            language={data.language || "bash"}
            fileName={data.language === "bash" ? "aws-cli.sh" : "source-code"}
          />
        </div>
      );

    case "image":
      return (
        <figure className="my-10">
          <div className="rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/5 shadow-2xl bg-slate-100 dark:bg-[#0d1117]">
            <img
              src={data.url}
              alt={data.caption || "Technical Diagram"}
              className="w-full h-auto hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
          {data.caption && (
            <figcaption className="text-center mt-4 text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">
              // {data.caption}
            </figcaption>
          )}
        </figure>
      );

    case "bullet_list":
      return (
        <ul className="space-y-4 mb-8 pl-2">
          {data.items?.map((item: string, i: number) => (
            <li
              key={i}
              className="flex items-start gap-4 text-slate-600 dark:text-slate-400"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 mt-2.5 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-base md:text-lg">{item}</span>
            </li>
          ))}
        </ul>
      );

    case "numbered_list":
      return (
        <div className="space-y-4 mb-10">
          {data.items?.map((item: string, i: number) => (
            <div
              key={i}
              className="flex gap-5 p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:border-emerald-500/20 transition-all group"
            >
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500 text-[#05070a] font-mono font-black italic shrink-0 shadow-lg">
                {i + 1}
              </span>
              <span className="text-base font-bold text-slate-700 dark:text-slate-300 self-center">
                {item}
              </span>
            </div>
          ))}
        </div>
      );

    case "quote":
      return (
        <div className="relative my-12 p-8 rounded-3xl bg-emerald-500/5 border-l-4 border-emerald-500 italic shadow-inner">
          <QuoteIcon
            className="absolute top-4 right-6 text-emerald-500/10"
            size={48}
          />
          <p className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-relaxed relative z-10">
            {data.text}
          </p>
        </div>
      );

    case "divider":
      return (
        <div className="flex items-center gap-4 my-16 opacity-20">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-emerald-500" />
          <Hash className="text-emerald-500" size={14} />
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-emerald-500" />
        </div>
      );

    default:
      return null;
  }
};

export default ContentBlockRenderer;
