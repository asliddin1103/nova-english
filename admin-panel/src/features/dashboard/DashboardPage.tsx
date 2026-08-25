import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, CreditCard, TrendUp, Clock, CheckCircle } from "@phosphor-icons/react";
import api from "../../services/api";

interface Stats {
  totalUsers: number; subscribedUsers: number; conversionRate: number;
  totalRevenue: number; pendingPayments: number; pendingSubmissions: number;
}

const STAT_CARDS = [
  { key: "totalUsers", label: "Jami foydalanuvchilar", icon: Users, color: "bg-blue-500", format: (v: number) => v.toLocaleString() },
  { key: "subscribedUsers", label: "Aktiv obunalar", icon: CheckCircle, color: "bg-emerald-500", format: (v: number) => v.toLocaleString() },
  { key: "conversionRate", label: "Konversiya", icon: TrendUp, color: "bg-purple-500", format: (v: number) => `${v}%` },
  { key: "totalRevenue", label: "Jami daromad", icon: CreditCard, color: "bg-[#1A73E8]", format: (v: number) => `${v.toLocaleString()} so''m` },
  { key: "pendingPayments", label: "Kutilayotgan to''lovlar", icon: Clock, color: "bg-amber-500", format: (v: number) => v },
  { key: "pendingSubmissions", label: "Kutilayotgan topshiriqlar", icon: Clock, color: "bg-orange-500", format: (v: number) => v },
];

export default function DashboardPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/dashboard").then(r => setStats(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Nova English boshqaruv paneli</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, format }, i) => (
          <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white rounded-[24px] p-5 shadow-soft border border-slate-100 cursor-pointer hover:shadow-md transition-all"
          >
            <div className={`w-11 h-11 rounded-2xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={22} weight="fill" className="text-white" />
            </div>
            <div className="text-2xl font-black text-slate-800">
              {loading ? <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" /> : format(stats?.[key as keyof Stats] as number ?? 0)}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-[24px] p-5 shadow-soft border border-slate-100">
        <h2 className="font-bold text-slate-800 mb-4">Tezkor harakatlar</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => onNavigate("payments")}
            className="px-4 py-2.5 nova-gradient text-white rounded-[14px] text-sm font-bold"
          >
            {stats?.pendingPayments ? `${stats.pendingPayments} ta to''lovni tekshirish` : "To''lovlarni tekshirish"}
          </button>
          <button onClick={() => onNavigate("submissions")}
            className="px-4 py-2.5 bg-purple-500 text-white rounded-[14px] text-sm font-bold"
          >
            {stats?.pendingSubmissions ? `${stats.pendingSubmissions} ta topshiriqni ko''rish` : "Topshiriqlarni ko''rish"}
          </button>
          <button onClick={() => onNavigate("users")}
            className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-[14px] text-sm font-bold"
          >
            Foydalanuvchilar
          </button>
        </div>
      </div>
    </div>
  );
}