import { useEffect, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  SlidersHorizontal, 
  Terminal, 
  BookOpen, 
  Code2,
  CheckCircle2
} from "lucide-react";
import { courseService } from "../../features/course/services/course";
import { categoryService } from "../../features/course/services/category";
import type { ICourse } from "../../features/course/types/course";
import type { ICategory } from "../../features/course/types/category";
import CourseCard from "./CourseCard";

const AllCoursesPage = () => {
  const { slug } = useParams(); 
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters from URL/State
  const activeCategory = location.state?.categoryId || searchParams.get("categoryId") || "";
  const activeLevel = searchParams.get("level") || "";
  const activeType = searchParams.get("type") || ""; 

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await categoryService.getAllCategories();
      if (res.success) setCategories(res.data.categories);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      const queryParams = {
        categoryId: activeCategory,
        level: activeLevel,
        type: activeType,
        limit: 12
      };
      const res = await courseService.getAllCourses(queryParams);
      if (res.success) setCourses(res.data.courses);
      setLoading(false);
    };
    getData();
  }, [activeCategory, activeLevel, activeType]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (!value || searchParams.get(key) === value) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#05070a] pt-28 pb-20 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="mb-12 border-b border-slate-100 dark:border-white/5 pb-10">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
            {slug ? slug.replace(/-/g, ' ') : "All Missions"} <span className="text-emerald-500">_</span>
          </h1>
          <p className="text-slate-500 font-mono text-xs mt-4 uppercase tracking-[0.3em]">
            Deployment_Status: {courses.length} Units_Available
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
          
          {/* SIDEBAR FILTERS */}
          <aside className="lg:col-span-3">
            <div className="sticky top-32 space-y-10">
              
              {/* Domain Filter */}
              <div>
                <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
                  <SlidersHorizontal size={14} /> System_Domain
                </h4>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => updateFilter("categoryId", cat._id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeCategory === cat._id ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"}`}
                    >
                      {cat.name}
                      {activeCategory === cat._id && <CheckCircle2 size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter (Theory vs Practical) - TAGRA UI */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Execution_Mode</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => updateFilter("type", "theory")}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${activeType === "theory" ? "border-emerald-500 bg-emerald-500/5 text-emerald-500" : "border-slate-200 dark:border-white/10 text-slate-400"}`}
                  >
                    <BookOpen size={20} />
                    <span className="text-[10px] font-bold uppercase">Theory</span>
                  </button>
                  <button 
                    onClick={() => updateFilter("type", "practical")}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${activeType === "practical" ? "border-emerald-500 bg-emerald-500/5 text-emerald-500" : "border-slate-200 dark:border-white/10 text-slate-400"}`}
                  >
                    <Code2 size={20} />
                    <span className="text-[10px] font-bold uppercase">Practical</span>
                  </button>
                </div>
              </div>

              {/* Level Filter */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Difficulty_Rating</h4>
                <div className="space-y-2">
                  {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
                    <label key={lvl} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={activeLevel === lvl.toLowerCase()}
                        onChange={() => updateFilter("level", lvl.toLowerCase())}
                        className="w-4 h-4 rounded border-slate-300 dark:border-white/10 text-emerald-500 focus:ring-emerald-500 bg-transparent"
                      />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-emerald-500 transition-colors uppercase italic">{lvl}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* COURSE GRID */}
          <main className="lg:col-span-9">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 rounded-[2.5rem] bg-slate-100 dark:bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {courses.map((course) => (
                    <motion.div
                      key={course._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <CourseCard course={course} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {courses.length === 0 && (
                  <div className="col-span-full py-32 text-center rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/5">
                    <Terminal className="mx-auto text-slate-300 dark:text-white/10 mb-4" size={48} />
                    <h3 className="text-xl font-black text-slate-400 dark:text-white/20 uppercase">No Missions Found</h3>
                    <p className="text-xs text-slate-400 mt-2 font-mono">Adjust your parameters or request a custom lab.</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AllCoursesPage;