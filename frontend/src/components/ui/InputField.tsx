import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputFieldProps {
  label: string;
  name?: string;
  value: string | undefined;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  placeholder?: string;
  icon: React.ReactNode;
  isPassword?: boolean;
  required?: boolean;
  maxLength?: number;
}

const InputField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon,
  isPassword = false,
  required = false, 
  maxLength,
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
          {icon}
        </div>
        <input
          name={name}
          value={value || ""}
          onChange={onChange}
          type={isPassword ? (showPassword ? "text" : "password") : "text"}
          placeholder={placeholder}
          required={required}     
          maxLength={maxLength}
          className="w-full py-4 pl-14 pr-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold focus:outline-none focus:border-emerald-500/50 transition-all uppercase text-slate-900 dark:text-white"
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default InputField;
