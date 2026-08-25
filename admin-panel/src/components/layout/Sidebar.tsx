import { motion } from "framer-motion";
import {
  ChartBar, Users, CreditCard, PencilLine, BookOpen, SignOut, List, X
} from "@phosphor-icons/react";
import { useAdminStore } from "../../store/useAdminStore";

type Page = "dashboard" | "payments" | "users" | "submissions" | "lessons";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const NAV_ITEMS: { id: Page; icon: any; label: string; roles?: string[] }[] = [
  { id: "dashboard", icon: ChartBar, label: "Dashboard" },
  { id: "payments", icon: CreditCard, label: "To''lovlar", roles: ["FINANCE_ADMIN", "SUPER_ADMIN"] },
  { id: "users", icon: Users, label: "Foydalanuvchilar" },
  { id: "submissions", icon: PencilLine, label: "Topshiriqlar", roles: ["TEACHER", "SUPER_ADMIN"] },
  { id: "lessons", icon: BookOpen, label: "Darslar", roles: ["CONTENT_ADMIN", "SUPER_ADMIN"] },
];

export default function Sidebar({ activePage, onNavigate, isOpen, onToggle }: SidebarProps) {
  const { admin, clearAuth } = useAdminStore();
  const role = admin?.role ?? "";

  const accessible = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(role) || role === "SUPER_ADMIN"
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onToggle} />}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 30 }}
        className="fixed left-0 top-0 bottom-0 w-64 bg-[#0A1628] z-50 flex flex-col lg:translate-x-0 lg:static lg:z-auto"
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl nova-gradient flex items-center justify-center">
                <span className="text-white font-black">N</span>
              </div>
              <div className="leading-none">
                <div className="text-white font-black text-sm">NOVA</div>
                <div className="text-[#FFC107] font-black text-sm">ENGLISH</div>
              </div>
            </div>
            <button onClick={onToggle} className="text-slate-400 hover:text-white lg:hidden"><X size={20} /></button>
          </div>
        </div>

        {/* Staff info */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="bg-white/5 rounded-2xl px-3 py-2.5">
            <div className="text-white font-bold text-sm truncate">{admin?.name}</div>
            <div className="text-slate-400 text-[11px] truncate">{admin?.email}</div>
            <div className="mt-1.5">
              <span className="text-[10px] bg-[#1A73E8]/20 text-[#4A9EF5] font-bold px-2 py-0.5 rounded-full">{role}</span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {accessible.map(({ id, icon: Icon, label }) => {
            const isActive = activePage === id;
            return (
              <button key={id} onClick={() => { onNavigate(id); onToggle(); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all w-full text-left ${
                  isActive ? "bg-[#1A73E8] text-white shadow-[0_4px_14px_rgba(26,115,232,0.4)]" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={20} weight={isActive ? "fill" : "regular"} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button onClick={clearAuth}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm font-semibold w-full"
          >
            <SignOut size={18} weight="bold" />
            Chiqish
          </button>
        </div>
      </motion.aside>
    </>
  );
}