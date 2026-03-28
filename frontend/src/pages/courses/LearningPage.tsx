import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import {
  Terminal,
  ChevronLeft,
  Layout,
  ThumbsUp,
  Share2,
  Eye,
  ChevronRight,
  PlayCircle,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { contentService } from "../../features/course/services/content";
import { chapterService } from "../../features/course/services/chapter";
import ContentBlockRenderer from "./ContentBlockRenderer";

const LearningPage = () => {
  const { contentSlug } = useParams();
  const location = useLocation();
  const { contentId, courseId } = location.state || {};

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [contentData, setContentData] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);

  // Helper to create slugs (Keep it same as ChapterAccordionItem)
  const createSlug = (text: string) =>
    text
      ?.toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");

  // 1. Fetch Chapters with their Contents
  useEffect(() => {
    if (courseId) {
      const fetchFullStructure = async () => {
        try {
          const res = await chapterService.getChaptersByCourse(courseId);
          if (res.success) {
            setChapters(res.data.chapters);
            // By default, open the first chapter
            if (res.data.chapters.length > 0)
              setActiveChapter(res.data.chapters[0]._id);
          }
        } catch (err) {
          console.error("SIDEBAR_STRUCTURE_ERROR", err);
        }
      };
      fetchFullStructure();
    }
  }, [courseId]);

  // 2. Fetch Single Content Data
  useEffect(() => {
    if (contentId) {
      const fetchContent = async () => {
        setLoading(true);
        try {
          const res = await contentService.getContentById(contentId);
          if (res.success) setContentData(res.data);
        } catch (err) {
          console.error("CONTENT_FETCH_ERROR", err);
        } finally {
          setLoading(false);
        }
      };
      fetchContent();
    }
  }, [contentId]);

  return (
    <div className="flex h-screen bg-white dark:bg-[#05070a] overflow-hidden relative">
      {/* --- SIDEBAR SECTION --- */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <>
            {/* Mobile Backdrop: Piche ka area click karke sidebar band karne ke liye */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />

            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed lg:relative inset-y-0 left-0 w-80 border-r border-slate-100 dark:border-white/5 bg-[#080a0f] flex flex-col z-50 shadow-2xl lg:shadow-none"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500">
                  Course_Roadmap
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-slate-400"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {chapters.map((ch) => (
                  <div key={ch._id} className="space-y-2">
                    <button
                      onClick={() =>
                        setActiveChapter(
                          activeChapter === ch._id ? null : ch._id,
                        )
                      }
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeChapter === ch._id ? "bg-white/5 text-emerald-500" : "text-slate-400 hover:bg-white/5"}`}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-tight truncate pr-2 text-left">
                        {ch.title}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`shrink-0 transition-transform ${activeChapter === ch._id ? "rotate-180" : ""}`}
                      />
                    </button>

                    {activeChapter === ch._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="pl-4 space-y-1 border-l border-white/5 ml-2 overflow-hidden"
                      >
                        {ch.contents?.map((item: any) => (
                          <Link
                            key={item._id}
                            to={`/learning/${createSlug(ch.title)}/${createSlug(item.title)}`}
                            state={{ contentId: item._id, courseId }}
                            onClick={() => {
                              if (window.innerWidth < 1024)
                                setSidebarOpen(false);
                            }}
                            className={`flex items-center gap-3 p-2 rounded-lg text-[10px] transition-all ${contentId === item._id ? "text-emerald-500 bg-emerald-500/5" : "text-slate-500 hover:text-slate-300"}`}
                          >
                            <PlayCircle size={12} className="shrink-0" />
                            <span className="uppercase tracking-wide truncate">
                              {item.title}
                            </span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT SECTION --- */}
      <main className="flex-1 overflow-y-auto relative bg-white dark:bg-[#05070a] custom-scrollbar w-full">
        {/* Header Section */}
        <header className="sticky top-0 z-30 bg-[#05070a]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 bg-white/5 rounded-lg text-emerald-500"
              >
                <Layout size={18} />
              </button>
            )}
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest overflow-hidden">
              <Link to="/" className="hover:text-emerald-500 shrink-0">
                Home
              </Link>
              <ChevronRight size={10} className="shrink-0" />
              <span className="text-emerald-500 truncate">{contentSlug}</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-20 animate-pulse space-y-6">
            <div className="h-12 w-3/4 bg-white/5 rounded-2xl" />
            <div className="h-64 w-full bg-white/5 rounded-[2rem]" />
          </div>
        ) : (
          <article className="max-w-6xl mx-auto px-4 md:px-12 py-10 md:py-16">
            <div className="mb-12">
              {/* Terminal Tag */}
              <div className="flex items-center gap-2 text-emerald-500 font-mono text-[10px] uppercase mb-4 tracking-[0.3em]">
                <Terminal size={14} /> <span>Sector_Access_Granted</span>
              </div>

              {/* Main Heading - Adaptive Color */}
              <h1 className="text-3xl md:text-6xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-tight mb-8">
                {contentData?.title || contentSlug?.replace(/-/g, " ")}
                <span className="text-emerald-500">_</span>
              </h1>

              {/* Stats Container - Adaptive Border & Background */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 py-6 border-y border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] px-6 rounded-3xl">
                <div className="flex items-center gap-6 md:gap-8">
                  {/* Views Stat */}
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-500">
                      <Eye size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-black text-slate-900 dark:text-white">
                        {contentData?.views || "0"}
                      </span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase">
                        Views
                      </span>
                    </div>
                  </div>

                  {/* Likes Stat */}
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-500">
                      <ThumbsUp size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-black text-slate-900 dark:text-white">
                        {contentData?.likes || "0"}
                      </span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase">
                        Likes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Share Button - Adaptive Color */}
                <button className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase italic tracking-widest hover:scale-105 transition-all shadow-lg shadow-slate-200 dark:shadow-none">
                  <Share2 size={14} /> Share
                </button>
              </div>
            </div>

            {/* --- ACTUAL BLOCKS RENDERING --- */}
            <div className="space-y-8">
              {contentData?.blocks?.map((block: any, index: number) => (
                <ContentBlockRenderer key={index} block={block} />
              ))}
            </div>
          </article>
        )}
      </main>
    </div>
  );
};

export default LearningPage;
