import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Search,
  Moon,
  Sun,
  ChevronDown,
  BookOpen,
  Code2,
  Trophy,
  Users2,
  Command,
  Settings,
  LogOut,
  User as UserIcon,
  Bell,
  CheckCircle2,
  FileText,
  Globe,
  ChevronRight,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useTheme } from "../../../hooks/useTheme";
import { useAuthStore } from "../../../store/useAuthStore";
import { Link } from "react-router-dom";
import { useNotify } from "../../../hooks/useNotify";
import { navigateTo } from "../../../utils/navigateHelper";
import { authService } from "../../../features/auth/services/authService";
import { categoryService } from "../../../features/course/services/category";

const ContextNavBar = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const [dynamicItems, setDynamicItems] = useState<any[]>([]);

  const user = useAuthStore((state) => state.user);

  const { notify } = useNotify();

  useEffect(() => {
    const fetchNavContent = async () => {
      try {
        const res = await categoryService.getAllCategories();
        const formatted = res.data.categories.map((cat) => ({
          name: cat.name,
          icon: cat.icon,
          slug: cat.slug,
          id: cat._id,
          path: `/courses/${cat.slug}`,
        }));
        setDynamicItems(formatted);
      } catch (err) {
        console.error("Failed to load nav categories", err);
      }
    };
    fetchNavContent();
  }, []);

  const navLinks = [
    {
      name: "Courses",
      icon: <BookOpen size={18} />,
      items: dynamicItems,
    },
    {
      name: "Practice",
      icon: <Code2 size={18} />,
      items: ["Problem Set", "Contests", "Interviews"],
    },
    { name: "Community", icon: <Users2 size={18} />, path: "/discuss" },
  ];

  const staticLinks = [
    { name: "Leaderboard", icon: <Trophy size={18} />, path: "/leaderboard" },
    { name: "Global", icon: <Globe size={18} />, path: "/network" },
    {
      name: "Resources",
      icon: <FileText size={18} />,
      items: [
        { name: "Docs", path: "/docs" },
        { name: "Blog", path: "/blog" },
        { name: "System Status", path: "/status" },
      ],
    },
  ];

  const allLinks = [...navLinks, ...staticLinks];

  const handleLogout = async () => {
    try {
      const response = await authService.logout();

      if (response?.success) {
        useAuthStore.getState().logout();

        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);

        notify(
          response.message || "SESSION_TERMINATED_SUCCESSFULLY",
          "SUCCESS",
        );
        setTimeout(() => {
          navigateTo("/login", { replace: true });
        }, 800);
      } else {
        notify(response?.message || "LOGOUT_FAILED_BY_SERVER", "ERROR");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "CONNECTION_FAILED_DURING_LOGOUT";
      console.error("Logout Error:", errorMessage);
      notify(errorMessage, "ERROR");
      useAuthStore.getState().logout();
      navigateTo("/login", { replace: true });
    }
  };

  return (
    <nav className="sticky top-0 w-full h-16 bg-white/80 dark:bg-[#0B1215]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 z-50 px-4 md:px-6 flex items-center justify-between transition-colors">
      {/* LEFT: LOGO & SEARCH */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="flex items-center gap-2 mr-2">
          <img
            src="/images/xynapse-labs.jpg"
            alt="Logo"
            className="h-8 w-8 rounded-lg object-cover border dark:border-white/10"
          />
          <span className="hidden sm:block font-black text-xl tracking-tighter dark:text-white italic">
            UP<span className="text-emerald-500">CODING</span>
          </span>
        </div>

        {/* Search with Command Icon */}
        <div className="hidden xl:flex items-center gap-3 bg-slate-100 dark:bg-white/5 border border-transparent focus-within:border-emerald-500/50 px-4 py-1.5 rounded-xl w-64 group transition-all">
          <Search
            size={14}
            className="text-slate-400 group-focus-within:text-emerald-500"
          />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm w-full dark:text-slate-100"
          />
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[10px] text-slate-400">
            <Command size={10} /> {/* Command USED HERE */}
            <span>K</span>
          </div>
        </div>
      </div>

      {/* CENTER: DESKTOP NAV */}
      <div className="hidden lg:flex items-center gap-1">
        {allLinks.map((link) => (
          <div
            key={link.name}
            className="relative"
            onMouseEnter={() => setActiveDropdown(link.name)}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button className="flex cursor-pointer items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-white/5 transition-all">
              {link.icon} {link.name}
              {link.items && (
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${activeDropdown === link.name ? "rotate-180" : ""}`}
                />
              )}
            </button>

            <AnimatePresence>
              {link.items && activeDropdown === link.name && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  // min-w-[260px] lagaya hai taaki minimum itna rahe, aur max-w-xs taaki bohot zyada lamba na ho jaye
                  className="absolute top-full left-0 mt-2 min-w-[260px] max-w-xs bg-white dark:bg-[#121a21] border border-slate-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 z-50 backdrop-blur-xl"
                >
                  {link.items.map((item, idx) => {
                    const isObject = typeof item === "object";
                    const itemName = isObject ? item.name : item;
                    const itemIcon = isObject ? item.icon : null;
                    const itemPath = isObject ? item.path : "#";
                    const catId = isObject ? item.id : null;

                    return (
                      <Link
                        key={idx}
                        to={itemPath}
                        state={{ categoryId: catId }} // Yahan id internal pass ho rahi hai
                        className="w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all group flex-nowrap"
                      >
                        {/* Icon Section (Same) */}
                        <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 group-hover:bg-emerald-500/20 transition-colors overflow-hidden border border-slate-200 dark:border-white/5">
                          {itemIcon ? (
                            <img
                              src={itemIcon}
                              alt={itemName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="bg-emerald-500/10 h-full w-full flex items-center justify-center text-[10px] text-emerald-500 font-bold uppercase">
                              {itemName.substring(0, 1)}
                            </div>
                          )}
                        </div>

                        {/* Text Section */}
                        <span className="flex-1 text-left truncate pr-2">
                          {itemName}
                        </span>

                        {/* Arrow Section */}
                        <ChevronRight
                          size={12}
                          className="flex-shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500"
                        />
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="flex items-center gap-1 sm:gap-3">
        <button
          onClick={toggleTheme}
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
        >
          {theme === "light" ? (
            <Moon size={20} className="text-slate-600" />
          ) : (
            <Sun size={20} className="text-yellow-400" />
          )}
        </button>

        {/* Notifications with CheckCircle2 */}
        <div
          className="relative"
          onMouseEnter={() => setIsNotifOpen(true)}
          onMouseLeave={() => setIsNotifOpen(false)}
        >
          <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl relative">
            <Bell size={20} className="text-slate-600 dark:text-slate-300" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0B1215]"></span>
          </button>
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#121a21] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-3 z-50"
              >
                <div className="flex items-center gap-2 mb-2 pb-2 border-b dark:border-white/5">
                  <CheckCircle2 size={16} className="text-emerald-500" />{" "}
                  {/* CheckCircle2 USED HERE */}
                  <span className="text-xs font-bold dark:text-white">
                    System Healthy
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  No new notifications
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div
          className="relative ml-2"
          onMouseEnter={() => setIsProfileOpen(true)}
          onMouseLeave={() => setIsProfileOpen(false)}
        >
          <div className="flex items-center gap-2 pl-3 border-l dark:border-white/10 cursor-pointer group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 p-[2px]">
              <div className="h-full w-full rounded-[7px] bg-white dark:bg-[#0B1215] overflow-hidden flex items-center justify-center">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user?.name || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  /* 🛡️ Default Image ya Icon jab user logout ho ya image na ho */
                  <img
                    src="https://ui-avatars.com/api/?name=Guest&background=0D8ABC&color=fff"
                    alt="Default User"
                    className="h-full w-full object-cover opacity-50 dark:opacity-80"
                  />
                )}
              </div>
            </div>
          </div>
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute cursor-pointer right-0 mt-2 w-52 bg-white dark:bg-[#121a21] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-2 z-50 
      before:content-[''] before:absolute before:-top-4 before:left-0 before:w-full before:h-4"
              >
                {/* ✅ Case 1: Agar User Login Hai */}
                {user ? (
                  <>
                    <Link to={"/profile"}>
                      <button className="w-full flex cursor-pointer items-center gap-3 px-4 py-2 text-sm rounded-lg dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10">
                        <UserIcon size={16} /> Profile_Panel
                      </button>
                    </Link>
                    <Link to={"/settings"}>
                      <button className="w-full flex items-center cursor-pointer gap-3 px-4 py-2 text-sm rounded-lg dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10">
                        <Settings size={16} /> System_Configs
                      </button>
                    </Link>

                    <hr className="my-2 dark:border-white/5" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center cursor-pointer gap-3 px-4 py-2 text-sm font-bold text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <LogOut size={16} /> Terminate_Session
                    </button>
                  </>
                ) : (
                  /* ✅ Case 2: Agar User Logout Hai */
                  <>
                    <Link to={"/login"}>
                      <button className="w-full flex cursor-pointer items-center gap-3 px-4 py-2 text-sm rounded-lg dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10">
                        <LogIn size={16} /> Authorize_Access
                      </button>
                    </Link>
                    <Link to={"/signup"}>
                      <button className="w-full flex cursor-pointer items-center gap-3 px-4 py-2 text-sm rounded-lg font-bold text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                        <UserPlus size={16} /> Initialize_Account
                      </button>
                    </Link>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MOBILE MENU (SCROLLABLE & FIXED) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="fixed inset-0 top-16 w-full h-[calc(100vh-64px)] bg-white dark:bg-[#0B1215] z-[60] p-6 overflow-y-auto lg:hidden"
          >
            <div className="flex flex-col gap-6">
              {allLinks.map((link) => (
                <div
                  key={link.name}
                  className="flex flex-col border-b dark:border-white/5 pb-4"
                >
                  {/* Link Header (Mobile) */}
                  <button
                    onClick={() => {
                      if (link.path) window.location.href = link.path;
                    }}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-3 text-lg font-bold dark:text-white">
                      <span className="text-emerald-500">{link.icon}</span>{" "}
                      {link.name}
                    </div>
                    {link.path && (
                      <ChevronRight size={18} className="text-slate-400" />
                    )}
                  </button>

                  {/* Sub-items Grid (Mobile) */}
                  {link.items && (
                    <div className="grid grid-cols-2 gap-3 mt-4 pl-4">
                      {link.items.map((item) => {
                        // Check if item is object (Docs/Blog) or string (Courses/Practice)
                        const itemName =
                          typeof item === "object" ? item.name : item;
                        const itemPath =
                          typeof item === "object" ? item.path : "#";

                        return (
                          <button
                            key={itemName}
                            onClick={() => {
                              if (itemPath !== "#")
                                window.location.href = itemPath;
                            }}
                            className="flex items-center gap-2 text-left py-3 px-4 text-[13px] font-medium bg-slate-50 dark:bg-white/5 rounded-2xl text-slate-600 dark:text-slate-400 active:scale-95 transition-all border border-transparent active:border-emerald-500/30"
                          >
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            {itemName}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default ContextNavBar;
