import { House, BookOpen, PencilLine, Books, User } from "@phosphor-icons/react";

type Tab = "home" | "lessons" | "tests" | "library" | "profile";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS = [
  { id: "home" as Tab, icon: House, label: "Bosh sahifa" },
  { id: "lessons" as Tab, icon: BookOpen, label: "Darslar" },
  { id: "tests" as Tab, icon: PencilLine, label: "Testlar" },
  { id: "library" as Tab, icon: Books, label: "Kutubxona" },
  { id: "profile" as Tab, icon: User, label: "Profil" },
];

const TAB_COLORS: Record<Tab, string> = {
  home: "text-[#1A73E8]",
  lessons: "text-emerald-500",
  tests: "text-purple-500",
  library: "text-amber-500",
  profile: "text-slate-600",
};

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around px-2 pt-2 pb-safe-or-2">
        {TABS.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 ${
                isActive ? `${TAB_COLORS[id]} scale-110` : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={24} weight={isActive ? "fill" : "regular"} />
              <span className="text-[10px] font-bold leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}