import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layers, ArrowUpRight, Terminal, Loader2 } from "lucide-react";
import { categoryService } from "../../features/course/services/category";
import type {
  ICategory,
  ICategoryResponse,
} from "../../features/course/types/category";
import { Link } from "react-router-dom";

const CategorySection = () => {
  // Fix 1: Explicitly defining the type to avoid 'never[]' error
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response: ICategoryResponse =
          await categoryService.getAllCategories();

        if (response.success && response.data) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center bg-white dark:bg-[#05070a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-emerald-500" size={40} />
          <p className="text-xs font-mono text-slate-500 animate-pulse uppercase tracking-[0.3em]">
            Syncing_Gateways...
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="py-24 bg-white dark:bg-[#05070a] px-6 transition-colors duration-500 relative overflow-hidden">
      {/* Background Decorative Text */}
      <div className="absolute top-20 right-[-5%] text-[15vw] font-black text-slate-100 dark:text-white/[0.02] select-none pointer-events-none uppercase tracking-tighter">
        Gateways
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] tracking-[0.4em] uppercase mb-4"
          >
            <Layers size={14} />
            Initialize_Battlefield
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase italic">
            Select Your <span className="text-emerald-500">Domain</span>
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat: ICategory, i: number) => (
            <Link
              key={cat._id}
              to={`/courses/${cat.slug}`}
              state={{ categoryId: cat._id }}
              className="block"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative p-8 h-full rounded-[2.5rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 backdrop-blur-xl overflow-hidden cursor-pointer transition-all hover:border-emerald-500/30"
              >
                {/* Card Glow Effect */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] group-hover:bg-emerald-500/10 transition-colors" />

                <div className="flex justify-between items-start mb-12">
                  {/* Icon Logic */}
                  <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-black/40 shadow-xl overflow-hidden border border-slate-100 dark:border-white/10 flex items-center justify-center p-3 group-hover:rotate-6 transition-transform duration-500">
                    {cat.icon ? (
                      <img
                        src={cat.icon}
                        alt={cat.name}
                        className="w-full h-full object-contain filter dark:brightness-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://cdn-icons-png.flaticon.com/512/1160/1160358.png";
                        }}
                      />
                    ) : (
                      <Terminal size={24} className="text-emerald-500" />
                    )}
                  </div>

                  <div className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-400 group-hover:text-emerald-500 group-hover:border-emerald-500/50 transition-all">
                    <ArrowUpRight size={20} />
                  </div>
                </div>

                <div className="relative z-10">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-2 font-mono">
                    Module_0{i + 1}
                  </h4>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                    {cat.description ||
                      "Master industry-standard engineering protocols in this dedicated sandbox environment."}
                  </p>
                </div>

                {/* Hover Footer Overlay */}
                <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                  Enter_Protocol{" "}
                  <div className="h-px flex-1 bg-emerald-500/30" />
                </div>
              </motion.div>
            </Link>
          ))}

          {/* Special "Request Custom Lab" Card */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="p-8 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-white/10 flex flex-col justify-center items-center text-center group hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full border border-dashed border-slate-400 dark:border-white/20 flex items-center justify-center text-slate-400 mb-4 group-hover:rotate-90 transition-transform">
              <Terminal size={20} />
            </div>
            <h3 className="text-slate-400 dark:text-white/40 font-bold uppercase tracking-widest text-[11px]">
              Request Custom Lab
            </h3>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
