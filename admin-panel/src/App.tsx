import { useState, useEffect } from "react";
import api from "./services/api";
import { Toaster } from "react-hot-toast";
import { List } from "@phosphor-icons/react";
import { useAdminStore } from "./store/useAdminStore";
import LoginPage from "./features/auth/LoginPage";
import Sidebar from "./components/layout/Sidebar";
import DashboardPage from "./features/dashboard/DashboardPage";
import PaymentsPage from "./features/payments/PaymentsPage";
import UsersPage from "./features/users/UsersPage";
import SubmissionsPage from "./features/submissions/SubmissionsPage";
import StatsPage from "./features/stats/StatsPage";

type Page = "dashboard" | "stats" | "payments" | "users" | "submissions" | "lessons";

export default function App() {
  const { isAuthenticated, admin, token } = useAdminStore();
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // On mount, try to restore session
  useEffect(() => {
    if (token && !admin) {
      // Token exists but admin not in memory — try to re-validate
      api.get("/admin/dashboard").catch(() => useAdminStore.getState().clearAuth());
    }
  }, []);

  if (!isAuthenticated) return <LoginPage />;

  const PAGE_TITLES: Record<Page, string> = {
    dashboard: "Dashboard",
    stats: "Statistika",
    payments: "To''lovlar",
    users: "Foydalanuvchilar",
    submissions: "Topshiriqlar",
    lessons: "Darslar",
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: "16px", fontWeight: 600, fontSize: "13px" } }} />

      {/* Sidebar — hidden on mobile, always visible on lg+ */}
      <div className="hidden lg:block shrink-0">
        <Sidebar activePage={page} onNavigate={setPage} isOpen={true} onToggle={() => {}} />
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Sidebar activePage={page} onNavigate={setPage} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100 shadow-sm shrink-0">
          <button onClick={() => setSidebarOpen(o => !o)} className="p-2 hover:bg-slate-100 rounded-xl">
            <List size={22} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg nova-gradient flex items-center justify-center">
              <span className="text-white font-black text-xs">N</span>
            </div>
            <span className="font-black text-sm text-slate-800">{PAGE_TITLES[page]}</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {page === "dashboard" && <DashboardPage onNavigate={(p) => setPage(p as Page)} />}
          {page === "stats" && <StatsPage />}
          {page === "payments" && <PaymentsPage />}
          {page === "users" && <UsersPage />}
          {page === "submissions" && <SubmissionsPage />}
          {page === "lessons" && (
            <div className="p-6 text-center text-slate-500">
              <p className="font-bold text-lg mt-20">Darslar boshqaruvi</p>
              <p className="text-sm mt-2">Bu bo''lim tez orada qo''shiladi</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}