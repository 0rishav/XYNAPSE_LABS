import type { IIntroBlock } from "../../features/course/types/courseIntro";

const IntroBlockRenderer = ({ block }: { block: IIntroBlock }) => {
  if (!block || !block.data) return null;

  const { type, data } = block;

  switch (type) {
    case "heading":
      return (
        <h2
          className={`font-black uppercase italic text-slate-900 dark:text-white mt-12 mb-6 tracking-tighter border-l-4 border-emerald-500 pl-5 ${
            data.level === 3 ? "text-xl md:text-2xl" : "text-3xl md:text-5xl"
          }`}
        >
          {data.text} {/* 👈 data.content ki jagah data.text use kiya */}
        </h2>
      );

    case "paragraph":
      return (
        <p className="text-base md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8 font-medium opacity-90">
          {data.text} {/* 👈 Yahan bhi data.text */}
        </p>
      );

    case "image":
      return (
        <div className="my-12 overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl bg-slate-100 dark:bg-white/5 group">
          <img
            src={data.url}
            alt={data.alt || "Mission Intel"}
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {data.caption && (
            <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                {data.caption}
              </p>
            </div>
          )}
        </div>
      );

    case "bullet_list":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {data.items?.map((item, idx) => (
            <div
              key={idx}
              className="group flex items-center gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all"
            >
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 transition-colors">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 group-hover:bg-white" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase italic tracking-tight">
                {item}
              </span>
            </div>
          ))}
        </div>
      );

    case "quote":
      return (
        <div className="relative my-14 p-10 md:p-14 rounded-[3.5rem] bg-emerald-500/5 border border-emerald-500/10 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
          <div className="absolute top-6 right-10 text-emerald-500/20 font-black text-8xl select-none">
            "
          </div>

          <p className="relative z-10 text-xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 italic leading-tight mb-6">
            {data.text}
          </p>

          {data.author && (
            <div className="flex items-center gap-4">
              <div className="h-px w-10 bg-emerald-500/40" />
              <span className="text-[11px] font-mono uppercase tracking-[0.4em] text-slate-500">
                Authorized By: {data.author}
              </span>
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="p-4 border border-dashed border-rose-500/30 rounded-xl my-4 text-[10px] font-mono text-rose-500">
          [SYSTEM_LOG]: Unknown Block Type "{type}" detected.
        </div>
      );
  }
};

export default IntroBlockRenderer;
