import React from "react";
import { motion } from "framer-motion";
import {
  Terminal,
  Layers,
  Zap,
  Clock,
  ChevronRight,
  PlayCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ICourse } from "../../features/course/types/course";

interface CourseCardProps {
  course: ICourse;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const categorySlug = course.categoryId?.slug || "all-missions";
  const courseSlug = course.slug;
  const courseId = course._id;
  const categoryId = course.categoryId?._id;

  const detailUrl = `/courses/${categorySlug}/${courseSlug}?id=${courseId}&categoryId=${categoryId}`;
  return (
    <Link to={detailUrl} state={{ courseData: course }} className="block group">
      <motion.div
        whileHover={{ y: -5 }}
        className="relative h-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_rgba(16,185,129,0.05)] hover:border-emerald-500/30"
      >
        {/* Top Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Badge Overlay */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {course.badges?.map((badge) => (
              <span
                key={badge}
                className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-400"
              >
                {badge}
              </span>
            ))}
          </div>

          {/* Type Icon (Theory vs Practical) */}
          <div className="absolute bottom-4 right-4 h-10 w-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white">
            {course.type === "practical" ? (
              <Terminal size={18} />
            ) : (
              <Layers size={18} />
            )}
          </div>

          {/* Hover Play Overlay */}
          <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white text-slate-900 p-3 rounded-full scale-75 group-hover:scale-100 transition-transform duration-300">
              <PlayCircle size={24} fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border ${
                course.level === "beginner"
                  ? "text-blue-500 border-blue-500/20 bg-blue-500/5"
                  : course.level === "intermediate"
                    ? "text-amber-500 border-amber-500/20 bg-amber-500/5"
                    : "text-rose-500 border-rose-500/20 bg-rose-500/5"
              }`}
            >
              {course.level}
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              {course.categoryId?.name}
            </span>
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-3 group-hover:text-emerald-500 transition-colors uppercase italic">
            {course.title}
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 font-medium leading-relaxed">
            {course.shortDescription}
          </p>

          {/* Footer Stats */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock size={14} />
                <span className="text-[10px] font-bold">12H</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Zap size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold uppercase">
                  Labs Included
                </span>
              </div>
            </div>

            <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <ChevronRight size={16} />
            </div>
          </div>
        </div>

        {/* Bottom Decorative Bar */}
        <div className="absolute bottom-0 left-0 w-0 h-1 bg-emerald-500 group-hover:w-full transition-all duration-500" />
      </motion.div>
    </Link>
  );
};

export default CourseCard;
