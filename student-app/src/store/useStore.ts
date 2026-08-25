import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: any, token: string) => void;
  clearAuth: () => void;
  updateUser: (user: any) => void;
}

export const useStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem("nova_token", token);
        set({ user, token, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem("nova_token");
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (user) => set({ user }),
    }),
    { name: "nova-auth", partialize: (s) => ({ token: s.token }) }
  )
);