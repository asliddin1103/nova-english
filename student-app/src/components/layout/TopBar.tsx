import { Bell } from "@phosphor-icons/react";

interface TopBarProps {
  title?: string;
  showLogo?: boolean;
}

export default function TopBar({ title, showLogo = true }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-3">
        {showLogo ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm border border-slate-100 shrink-0 bg-white">
              <img src="/logo.jpg" alt="Nova English Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-black text-[#0A1628] text-base tracking-tight">NOVA</span>
              <span className="font-black text-[#FFC107] text-base tracking-tight"> ENGLISH</span>
            </div>
          </div>
        ) : (
          <h1 className="font-bold text-slate-800 text-lg">{title}</h1>
        )}

        <button className="relative w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-slate-100 transition-colors">
          <Bell size={20} weight="regular" className="text-slate-600" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
      </div>
    </header>
  );
}