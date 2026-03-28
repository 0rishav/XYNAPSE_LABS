import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";

export const useNotify = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useNotify must be used within ToastProvider");
  return context;
};
