import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminState {
  admin: { id: number; name: string; email: string; role: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (admin: any, token: string) => void;
  clearAuth: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      admin: null, token: null, isAuthenticated: false,
      setAuth: (admin, token) => {
        localStorage.setItem("nova_admin_token", token);
        set({ admin, token, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem("nova_admin_token");
        set({ admin: null, token: null, isAuthenticated: false });
      },
    }),
    { name: "nova-admin-auth", partialize: (s) => ({ token: s.token }) }
  )
);