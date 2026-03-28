import { useState, useRef, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaGithub,
  FaGoogle,
  FaUser,
  FaEnvelope,
  FaLock,
  FaCamera,
  FaArrowRight,
  FaShieldAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import type { RegisterPayload } from "../../../features/auth/types/auth";
import { useNotify } from "../../../hooks/useNotify";
import { authService } from "../../../features/auth/services/authService";
import { Loader2 } from "lucide-react";

const Signup = () => {
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [formData, setFormData] = useState<RegisterPayload>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePic: null,
  });

  const { notify } = useNotify();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");
  const [loading, setLoading] = useState(false);

  const getStrength = (pass: string) => {
    let strength = 0;
    if (pass.length > 5) strength++;
    if (pass.length > 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) strength++;
    if (/[@$!%*?&]/.test(pass)) strength++;
    return strength;
  };

  const strength = getStrength(formData.password);
  const strengthColor =
    ["bg-red-500", "bg-amber-500", "bg-emerald-500"][strength - 1] ||
    "bg-slate-200 dark:bg-white/10";
  const strengthText =
    ["WEAK_PROTOCOL", "MEDIUM_SECURITY", "STRENGTH_OPTIMIZED"][strength - 1] ||
    "WAITING_FOR_INPUT";

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, profilePic: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return notify("PASSWORDS_MISMATCH_ERROR", "ERROR");
    }

    setLoading(true);
    try {
      const response = await authService.register(formData, referralCode);

      if (response.success) {
        notify(response.message || "ACTIVATION_CODE_DISPATCHED", "SUCCESS");
        setShowOTP(true);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "CONNECTION_FAILED";
      notify(errorMsg, "ERROR");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const activationCode = otp.join("");

    if (activationCode.length < 6) {
      return notify("INCOMPLETE_SECURITY_CODE", "ERROR");
    }

    setLoading(true);
    try {
      const response = await authService.activate(activationCode);

      if (response.success) {
        notify("IDENTITY_VERIFIED_SUCCESSFULLY", "SUCCESS");

        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "INVALID_CODE";
      notify(errorMsg, "ERROR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#05070a] flex items-center justify-center p-4 md:p-10 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div
        className={`max-w-[500px] w-full z-10 transition-all duration-500 ${showOTP ? "blur-2xl scale-95 opacity-0" : "opacity-100"}`}
      >
        {/* Registration Card */}
        <div className="bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-white/10 p-8 md:p-12 rounded-[3.5rem] shadow-2xl">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-3">
              Join_The_Node
            </h2>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
              Initialize your engineer identity
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex justify-center mb-8">
              <div
                onClick={handleImageClick}
                className="relative w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center cursor-pointer group hover:border-emerald-500/50 transition-all overflow-hidden"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaCamera
                    className="text-slate-400 group-hover:text-emerald-500 transition-colors"
                    size={24}
                  />
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black text-white uppercase">
                    Upload
                  </span>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  placeholder="FULL_NAME"
                  className="w-full py-4 pl-14 pr-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[11px] font-black text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all uppercase placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="relative group">
                <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="email"
                  placeholder="EMAIL_ADDRESS"
                  className="w-full py-4 pl-14 pr-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[11px] font-black text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all uppercase placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="relative group">
                <FaLock
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                  size={12}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="PASSWORD"
                  className="w-full py-4 pl-12 pr-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[11px] font-black text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? (
                    <FaEyeSlash size={16} />
                  ) : (
                    <FaEye size={16} />
                  )}
                </button>
              </div>

              <div className="px-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {strengthText}
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 w-8 rounded-full transition-all duration-500 ${i <= strength ? strengthColor : "bg-slate-200 dark:bg-white/10"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative group">
                <FaLock
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                  size={12}
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="CONFIRM_PASSWORD"
                  className="w-full py-4 pl-12 pr-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[11px] font-black text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash size={16} />
                  ) : (
                    <FaEye size={16} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full cursor-pointer py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 group mt-4
    ${
      loading
        ? "bg-slate-800 dark:bg-emerald-900/50 cursor-not-allowed opacity-80"
        : "bg-slate-950 text-white dark:bg-emerald-500 dark:text-slate-900 shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
    }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  <span className="animate-pulse">PROCESSING_DATA...</span>
                </>
              ) : (
                <>
                  INITIALIZE_AUTH
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 space-y-6">
            <div className="flex gap-4">
              <button className="flex-1 cursor-pointer py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
                <FaGithub size={16} /> GitHub
              </button>
              <button className="flex-1 cursor-pointer py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
                <FaGoogle size={16} className="text-red-500" /> Google
              </button>
            </div>

            <p className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Already have an identity?{" "}
              <Link
                to="/login"
                className="text-emerald-500 hover:text-emerald-400 underline underline-offset-4 decoration-emerald-500/30"
              >
                Return_To_Base
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showOTP && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-[#05070a]/90 backdrop-blur-xl p-6"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="max-w-[450px] w-full bg-white dark:bg-black p-8 md:p-12 rounded-[4rem] border border-slate-200 dark:border-white/10 shadow-2xl text-center relative"
            >
              <button
                onClick={() => setShowOTP(false)}
                className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors"
              >
                <IoClose size={24} />
              </button>

              <div className="mb-8 inline-flex p-5 rounded-[2rem] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <FaShieldAlt size={40} className="animate-pulse" />
              </div>

              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4">
                Signal_Verification
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] mb-10 leading-relaxed">
                Enter the 6-digit secret code sent to your <br /> communication
                channel.
              </p>

              <div className="flex justify-between gap-2 md:gap-3 mb-10">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-14 md:w-14 md:h-16 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-2xl text-center text-2xl font-black text-emerald-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading} 
                className={`w-full py-4 cursor-pointer rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2
    ${
      loading
        ? "bg-emerald-900/50 text-emerald-500/50 cursor-not-allowed border border-emerald-500/20"
        : "bg-emerald-500 text-slate-900 shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98]"
    }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="tracking-[0.3em] animate-pulse">
                      VALIDATING_NODE...
                    </span>
                  </>
                ) : (
                  "AUTHORIZE_NODE"
                )}
              </button>

              <p className="mt-6 text-[9px] font-bold text-slate-500 dark:text-slate-600 uppercase tracking-widest">
                Didn't receive signal?{" "}
                <button className="text-emerald-500 hover:underline">
                  Resend_Transmission
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Signup;
