import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {  ChevronDown, Clock, PlayCircle, Lock, FileText } from "lucide-react";

// Services & Types
import { contentService } from "../../features/course/services/content";
import type { IContent } from "../../features/course/types/content";
import { mcqPaperService } from "../../features/mcq/services/mcqPaper";

const ChapterAccordionItem = ({ chapter, courseId, isActive, onToggle }: any) => {
  const [contents, setContents] = useState<IContent[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  const createSlug = (text: string) => 
    text.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

 useEffect(() => {
  if (!isActive) return;

  const fetchData = async () => {
    // 1. Fetch Contents
    if (contents.length === 0) {
      setFetching(true);
      try {
        const res = await contentService.getContentsByChapter(chapter._id);
        if (res.success) setContents(res.data.contents);
      } catch (err) {
        console.error("CONTENTS_FETCH_ERROR:", err);
      } finally {
        setFetching(false);
      }
    }

    if (papers.length === 0) {
      try {
        const res = await mcqPaperService.getPapersByChapter(chapter._id);
        if (res.data?.papers) setPapers(res.data.papers);
      } catch (err) {
        console.error("MCQ_FETCH_ERROR:", err);
      } 
    }
  };

  fetchData();
}, [isActive, chapter._id]);

  return (
    <div className="group border border-slate-100 dark:border-white/5 rounded-[2rem] overflow-hidden bg-white dark:bg-[#0d1117] hover:border-emerald-500/20 transition-all shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-7 text-left group-hover:bg-slate-50/50 dark:group-hover:bg-white/5 transition-colors"
      >
        <div className="flex gap-5 items-center">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex flex-col items-center justify-center border border-slate-200 dark:border-white/10 text-slate-400 group-hover:text-emerald-500 transition-all">
            <span className="text-[8px] font-mono uppercase">Lvl</span>
            <span className="text-base font-black italic leading-none">{chapter.order}</span>
          </div>
          <div>
            <h4 className="text-sm font-black uppercase italic text-slate-800 dark:text-white tracking-tight leading-tight mb-2">
              {chapter.title}
            </h4>
            <div className="flex items-center gap-3 text-[9px] font-mono text-slate-500">
              <Clock size={10} /> {chapter.estimatedDurationMinutes}M
            </div>
          </div>
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-500 ${isActive ? "rotate-180 text-emerald-500" : ""}`} />
      </button>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5"
          >
            <div className="p-4 space-y-4">
              {/* --- CONTENT SECTION --- */}
              <div className="space-y-2">
                {fetching ? (
                  <div className="text-[10px] font-mono text-emerald-500 animate-pulse pl-4">Syncing_Nodes...</div>
                ) : contents.length > 0 ? (
                  contents.map((content) => (
                    <Link
                      key={content._id}
                      to={`/learning/${createSlug(chapter.title)}/${createSlug(content.title)}`}
                      state={{ contentId: content._id, courseId: courseId, chapterId: chapter._id }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-transparent hover:border-emerald-500/20 hover:shadow-lg transition-all group/item"
                    >
                      <div className="flex items-center gap-4">
                        <PlayCircle size={14} className="text-slate-400 group-hover/item:text-emerald-500" />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{content.title}</span>
                      </div>
                      {content.accessType !== "free" && <Lock size={12} className="text-slate-500" />}
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-center text-[10px] font-mono text-slate-500 uppercase">Sector_Empty</div>
                )}
              </div>

              {/* --- MCQ ASSESSMENT SECTION --- */}
              {papers.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-2">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest pl-2">Assessment_Papers</span>
                  {papers.map((paper) => (
                    <a
                      key={paper._id}
                      href={`/mcq/attempt/${paper._id}?courseId=${courseId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <FileText size={14} className="text-emerald-500" />
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{paper.title}</span>
                      </div>
                      <span className="text-[9px] font-bold bg-emerald-500 text-white px-3 py-1 rounded">START</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChapterAccordionItem;