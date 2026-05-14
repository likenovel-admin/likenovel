import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

export const useAuthStore = create(
  persist<AuthStore>(
    (set) => ({
      isAuthenticated: false,
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
    }),
    {
      name: "auth",
    }
  )
);
