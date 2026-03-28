import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "../features/auth/types/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  setCredentials: (user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setCredentials: (user) => set({ user, isAuthenticated: true }),

      updateUser: (user) => set({ user }),

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "xynapse-auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
