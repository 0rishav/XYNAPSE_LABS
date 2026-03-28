import { Shield, Check, X } from "lucide-react";
import InputField from "../../components/ui/InputField";

const SecurityForm = ({ formData, handleInputChange }: any) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
  const isStrong = passwordRegex.test(formData.newPassword || "");

  // Password Strength Logic
  const getStrength = () => {
    const pwd = formData.newPassword || "";
    if (pwd.length === 0)
      return { width: "0%", color: "bg-slate-200", label: "VOID" };
    if (isStrong)
      return { width: "100%", color: "bg-emerald-500", label: "SECURE" };
    if (pwd.length >= 6)
      return { width: "50%", color: "bg-amber-500", label: "VULNERABLE" };
    return { width: "25%", color: "bg-red-500", label: "WEAK" };
  };

  const strength = getStrength();

  return (
    <div className="max-w-full space-y-6">
      <InputField
        label="Current_Access_Key"
        name="currentPassword"
        value={formData.currentPassword}
        onChange={handleInputChange}
        placeholder="••••••••"
        icon={<Shield size={16} />}
        isPassword
      />

      <div className="space-y-3">
        <InputField
          label="New_Access_Key"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleInputChange}
          placeholder="••••••••"
          icon={<Shield size={16} />}
          isPassword
        />

        <div className="px-1 space-y-2">
          <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
            <span className="text-slate-500">Strength_Status:</span>
            <span className={strength.color.replace("bg-", "text-")}>
              {strength.label}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${strength.color}`}
              style={{ width: strength.width }}
            />
          </div>
        </div>
      </div>

      <InputField
        label="Confirm_New_Access_Key"
        name="confirmNewPassword"
        value={formData.confirmNewPassword}
        onChange={handleInputChange}
        placeholder="••••••••"
        icon={<Shield size={16} />}
        isPassword
      />

      {/* 🛡️ Requirements List */}
      <div className="bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-4 border border-slate-200 dark:border-white/5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
          Security_Requirements:
        </h4>
        <ul className="space-y-2">
          {[
            { label: "8+ Characters", met: formData.newPassword?.length >= 8 },
            {
              label: "Alpha-Numeric (Aa1)",
              met:
                /[A-Z]/.test(formData.newPassword) &&
                /\d/.test(formData.newPassword),
            },
            {
              label: "Special Character (!@#)",
              met: /[^\w\s]/.test(formData.newPassword),
            },
          ].map((req, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight"
            >
              {req.met ? (
                <Check size={12} className="text-emerald-500" />
              ) : (
                <X size={12} className="text-slate-300" />
              )}
              <span
                className={
                  req.met ? "text-slate-900 dark:text-white" : "text-slate-400"
                }
              >
                {req.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SecurityForm;
