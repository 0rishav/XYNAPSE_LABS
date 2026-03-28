import { useEffect, useState } from "react";
import { useLocation, useSearchParams, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Shield, Target, Cpu } from "lucide-react";
import { courseIntroService } from "../../features/course/services/courseIntro";
import { chapterService } from "../../features/course/services/chapter";
import type { ICourseIntro } from "../../features/course/types/courseIntro";
import type { IChapter } from "../../features/course/types/chapter";
import IntroBlockRenderer from "./IntroBlockRenderer";
import ReviewSection from "./ReviewSection";
import ChapterAccordionItem from "./ChapterAccordionItem";

const CourseDetailPage = () => {
  const { categorySlug, courseSlug } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const courseId = searchParams.get("id");
  const cachedCourse = location.state?.courseData;

  const [intro, setIntro] = useState<ICourseIntro | null>(null);
  const [chapters, setChapters] = useState<IChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      const fetchMissionData = async () => {
        setLoading(true);
        try {
          const [introRes, chapterRes] = await Promise.all([
            courseIntroService.getCourseIntro(courseId),
            chapterService.getChaptersByCourse(courseId),
          ]);

          if (introRes.success) setIntro(introRes.data);
          // Backend structure: res.data.chapters
          if (chapterRes.success) setChapters(chapterRes.data.chapters);
        } catch (err) {
          console.error("DATA_FETCH_ERROR:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchMissionData();
    }
  }, [courseId]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#05070a] pt-32 pb-20 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6">
        {/* 1. SECURE BREADCRUMB */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-500 uppercase tracking-[0.3em] mb-6">
          <Shield size={12} />
          <span>Secure_Access</span>
          <span>/</span>
          <span>{categorySlug?.replace(/-/g, " ")}</span>
        </div>

        {/* 2. HERO SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h1 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-6">
            {cachedCourse?.title || courseSlug?.replace(/-/g, " ")}
            <span className="text-emerald-500">.</span>
          </h1>

          <div className="flex flex-wrap gap-6 border-y border-slate-100 dark:border-white/5 py-8">
            <div className="flex items-center gap-3">
              <Target size={18} className="text-slate-400" />
              <span className="text-[11px] font-black uppercase text-slate-500 tracking-widest">
                Target: {cachedCourse?.level || "Advanced"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Cpu size={18} className="text-slate-400" />
              <span className="text-[11px] font-black uppercase text-slate-500 tracking-widest">
                System: {cachedCourse?.type || "Practical"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Terminal size={18} className="text-slate-400" />
              <span className="text-[11px] font-black uppercase text-slate-500 tracking-widest">
                Status: Ready_For_Deploy
              </span>
            </div>
          </div>
        </motion.div>

        {/* 3. MAIN CONTENT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* --- LEFT: MISSION BRIEFING (INTRO) --- */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-10">
              <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.4em]">
                Mission_Briefing
              </span>
            </div>

            <main className="relative">
              {loading ? (
                <div className="space-y-8 animate-pulse">
                  <div className="h-10 w-3/4 bg-slate-100 dark:bg-white/5 rounded-2xl" />
                  <div className="h-64 w-full bg-slate-100 dark:bg-white/5 rounded-[3rem]" />
                  <div className="h-20 w-full bg-slate-100 dark:bg-white/5 rounded-2xl" />
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {intro?.blocks?.map((block) => (
                    <IntroBlockRenderer
                      key={`${block.type}-${block?.data?.order}`}
                      block={block}
                    />
                  ))}
                </motion.div>
              )}
            </main>
          </div>

          {/* --- RIGHT: MISSION SYLLABUS (CHAPTERS) --- */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="flex items-center gap-3 mb-10">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.4em]">
                Syllabus_Structure
              </span>
              <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
            </div>

            <div className="space-y-4">
              {loading
                ? // Skeleton Loading State
                  [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-24 w-full bg-slate-100 dark:bg-white/5 rounded-[2rem] animate-pulse"
                    />
                  ))
                : // Real Data Rendering
                  chapters.map((chapter) => (
                    <ChapterAccordionItem
                      key={chapter._id}
                      chapter={chapter}
                      courseId={courseId || ""} // useParams ya searchParams se aa raha courseId
                      isActive={activeChapter === chapter._id}
                      onToggle={() =>
                        setActiveChapter(
                          activeChapter === chapter._id ? null : chapter._id,
                        )
                      }
                    />
                  ))}
            </div>
          </div>
        </div>

        <div className="mt-20 border-t border-slate-100 dark:border-white/5 pt-20">
          <ReviewSection courseId={courseId} />
        </div>

        {/* 4. FLOATING MISSION CONTROL */}
        <div className="fixed bottom-10 right-10 z-50">
          <button className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-5 rounded-full font-black uppercase italic tracking-tighter shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
            Initialize_Mission <Terminal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
