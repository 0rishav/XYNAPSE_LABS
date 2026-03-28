import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  ShieldCheck,
  Lock,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

import { useNotify } from "../../../hooks/useNotify";
import { navigateTo } from "../../../utils/navigateHelper";
import { authService } from "../../../features/auth/services/authService";
import InputField from "../../../components/ui/InputField";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Form States
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [grantToken, setGrantToken] = useState(""); 
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const {notify} = useNotify()

  // --- API Handlers ---

  // Phase 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      if (res.success) {
        notify(res.message || "OTP_SENT_SUCCESSFULLY", "SUCCESS");
        setStep(2);
      }
    } catch (err: any) {
      notify(err?.response?.data?.message || "REQUEST_FAILED", "ERROR");
    } finally {
      setLoading(false);
    }
  };

  // Phase 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.verifyResetOtp(otp);
      if (res.success) {
        setGrantToken(res.data.token); // Backend se Grant Token save karo
        notify("IDENTITY_VERIFIED_PROCEED", "SUCCESS");
        setStep(3);
      }
    } catch (err: any) {
      notify(err?.response?.data?.message || "INVALID_OTP", "ERROR");
    } finally {
      setLoading(false);
    }
  };

  // Phase 3: Final Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return notify("PASSWORDS_DO_NOT_MATCH", "ERROR");
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword({
        token: grantToken,
        newPassword: passwords.newPassword,
        confirmNewPassword: passwords.confirmPassword,
      });
      if (res.success) {
        notify(res.message, "SUCCESS");
        setTimeout(() => navigateTo("/login"), 1500);
      }
    } catch (err: any) {
      notify(err?.response?.data?.message || "RESET_FAILED", "ERROR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1215] flex items-center justify-center p-4 relative overflow-hidden font-mono">
      {/* 🌌 Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/[0.02] border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-2xl relative z-10"
      >
        {/* Step Progress Bar */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-700 ${step >= s ? "bg-emerald-500 shadow-[0_0_15px_#10b981]" : "bg-white/5"}`}
            />
          ))}
        </div>

        <h2 className="text-xl font-black text-white tracking-tighter uppercase mb-2">
          {step === 1 && "Access_Recovery"}
          {step === 2 && "Secure_Verification"}
          {step === 3 && "Finalize_Protocol"}
        </h2>

        <form
          onSubmit={
            step === 1
              ? handleRequestOTP
              : step === 2
                ? handleVerifyOTP
                : handleResetPassword
          }
          className="space-y-6"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <InputField
                  label="USER_IDENTIFIER"
                  placeholder="name@nexus.com"
                  icon={<Mail size={18} />}
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  required={true}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <InputField
                  label="DECRYPTION_CODE"
                  placeholder="######"
                  icon={<ShieldCheck size={18} />}
                  value={otp}
                  onChange={(e: any) => setOtp(e.target.value)}
                  maxLength={6}
                  required={true}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="relative">
                  <InputField
                    label="NEW_ACCESS_KEY"
                    isPassword={!showPass}
                    icon={<Lock size={18} />}
                    value={passwords.newPassword}
                    onChange={(e: any) =>
                      setPasswords({
                        ...passwords,
                        newPassword: e.target.value,
                      })
                    }
                    required={true}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-10 text-slate-500 hover:text-emerald-500"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <InputField
                  label="CONFIRM_KEY"
                  isPassword={!showPass}
                  icon={<Lock size={18} />}
                  value={passwords.confirmPassword}
                  onChange={(e: any) =>
                    setPasswords({
                      ...passwords,
                      confirmPassword: e.target.value,
                    })
                  }
                  required={true}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            disabled={loading}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] tracking-[0.3em] uppercase rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <>
                {" "}
                {step === 3 ? "RESET_SYSTEM" : "CONTINUE_PHASE"}{" "}
                <ArrowRight size={14} />{" "}
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
