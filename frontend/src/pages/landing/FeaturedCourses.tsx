import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, BarChart3, ArrowRight, Trophy, Loader2 } from "lucide-react";
import type { ICourse } from "../../features/course/types/course";
import { courseService } from "../../features/course/services/course";
import { Link } from "react-router-dom";

const FeaturedCourses = () => {
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Landing page ke liye limit 8
        const response = await courseService.getAllCourses({ limit: 8 });
        if (response.success) {
          setCourses(response.data.courses);
        }
      } catch (error) {
        console.error("Mission_Fetch_Failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Level Badge Color Logic
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "intermediate":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "advanced":
        return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    }
  };

  if (loading)
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" />
      </div>
    );

  return (
    <section className="py-24 bg-[#fafbfc] dark:bg-[#030508] transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-500 font-mono text-[10px] tracking-[0.4em] uppercase mb-4">
              <Zap size={14} fill="currentColor" />
              Active_Missions_Available
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
              Featured{" "}
              <span className="text-emerald-500">
                Missions
              </span>
            </h2>
          </div>
          <Link to={"/all-courses"}>
            <button className="group cursor-pointer flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-widest">
              View All Ops{" "}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </Link>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course, i) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative flex flex-col bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Badges (Hot/New) */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {course.badges?.map((badge) => (
                    <span
                      key={badge}
                      className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/20 text-[8px] font-black text-white uppercase tracking-widest rounded-full"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getLevelColor(course.level)}`}
                  >
                    {course.level}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                    <Trophy size={12} className="text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">
                      500 XP
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-emerald-500 transition-colors">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 font-medium leading-relaxed italic">
                  "{course.shortDescription}"
                </p>

                {/* Tags */}
                <div className="mt-auto flex flex-wrap gap-1.5 mb-6">
                  {course.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-mono text-slate-400 dark:text-slate-500"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Enroll_Now
                    </span>
                  </div>
                 <Link to={"/course/:id"}>
                  <div className="h-8 w-8 cursor-pointer rounded-full bg-slate-900 dark:bg-emerald-500 flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-300">
                    <ArrowRight size={14} />
                  </div>
                 </Link>
                </div>
              </div>

              {/* Hover Glow Line */}
              <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 w-0 group-hover:w-full transition-all duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;
