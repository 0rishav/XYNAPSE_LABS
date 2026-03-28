import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  ArrowRight,
  Terminal,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useNotify } from "../../../hooks/useNotify";
import type { LoginPayload } from "../../../features/auth/types/auth";
import { authService } from "../../../features/auth/services/authService";
import { useAuthStore } from "../../../store/useAuthStore";

const Login = () => {
  const navigate = useNavigate();
  const { notify } = useNotify();

  // States
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LoginPayload>({
    email: "",
    password: "",
    deviceId: "",
    deviceName: "",
  });

  const setCredentials = useAuthStore((state) => state.setCredentials);

  // 1. Device Info Capture Logic
  useEffect(() => {
    const getDeviceInfo = () => {
      const ua = navigator.userAgent;
      let deviceName = "Unknown Device";

      // Simple Device Detection
      if (/android/i.test(ua)) deviceName = "Android Node";
      else if (/iPhone|iPad|iPod/i.test(ua)) deviceName = "iOS Node";
      else if (/Windows/i.test(ua)) deviceName = "Windows Workstation";
      else if (/Mac/i.test(ua)) deviceName = "Macintosh Station";
      else if (/Linux/i.test(ua)) deviceName = "Linux Terminal";

      // Generate a simple Device ID (Browser based)
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl");
      const renderer = gl ? gl.getParameter(gl.RENDERER) : "Unknown";
      const id = btoa(`${ua}-${renderer}`).substring(0, 16);

      setFormData((prev) => ({ ...prev, deviceId: id, deviceName }));
    };

    getDeviceInfo();
  }, []);

  // 2. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      return notify("MISSING_CREDENTIALS", "ERROR");
    }

    setLoading(true);
    try {
      const response = await authService.login(formData);
      const userData = response.data.user || response.user;

      if (response.requires2FA) {
        notify("2FA_PROTOCOL_REQUIRED", "SUCCESS");
        // Yahan 2FA modal trigger karne ka logic aayega
      } else if (userData) {
        setCredentials(userData);

        notify("SESSION_ESTABLISHED_SUCCESSFULLY", "SUCCESS");
        setTimeout(() => {
          navigate("/docs");
        }, 1500);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "AUTHENTICATION_FAILED";
      notify(msg, "ERROR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#05070a] flex items-center justify-center p-6">
      <div className="max-w-[450px] w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-2">
            <Terminal size={32} />
          </div>
          <h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter italic">
            Initialize_Session
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-tight">
            Node:{" "}
            <span className="text-emerald-500">{formData.deviceName}</span> |
            ID: {formData.deviceId}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div className="relative group">
            <Mail
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
              size={18}
            />
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="USER_EMAIL"
              className="w-full py-4 pl-14 pr-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold focus:outline-none focus:border-emerald-500/50 transition-all uppercase placeholder:text-slate-400"
            />
          </div>

          {/* Password Input with Toggle */}
          <div className="relative group">
            <Lock
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
              size={18}
            />
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="ACCESS_KEY"
              className="w-full py-4 pl-14 pr-14 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold focus:outline-none focus:border-emerald-500/50 transition-all uppercase placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex justify-end px-2">
            <Link
              to="/forgot-password"
              className="text-[10px] font-black text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all uppercase tracking-widest"
            >
              Lost_Access_Key?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 group
              ${loading ? "bg-slate-800 cursor-not-allowed" : "bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98]"}`}
          >
            {loading ? (
              <>
                {" "}
                <Loader2 className="animate-spin" size={16} />{" "}
                CONNECTING_NODE...{" "}
              </>
            ) : (
              <>
                {" "}
                BOOT_SESSION{" "}
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />{" "}
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 text-[9px] font-black text-slate-300 dark:text-white/5 uppercase">
          <div className="h-[1px] flex-grow bg-current" />
          <span>OAuth_Protocol</span>
          <div className="h-[1px] flex-grow bg-current" />
        </div>

        <div className="space-y-3">
          <button className="w-full cursor-pointer py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-black dark:text-white uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
            <FaGoogle size={18} /> Continue with Google
          </button>
          <button className="w-full cursor-pointer py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-black dark:text-white uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
            <FaGithub size={18} /> Continue with GitHub
          </button>
        </div>

        <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          New Engineer?{" "}
          <Link to="/signup" className="text-emerald-500 hover:underline">
            Register_Node
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
