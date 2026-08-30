import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FilePdf, Users, CheckCircle, CreditCard, ChartBar, SpinnerGap } from "@phosphor-icons/react";
import api from "../../services/api";
import { exportReportToPdf } from "../../services/exportService";
import toast from "react-hot-toast";

interface StatItem {
  label: string;
  count: number;
  pct: number;
}

interface StatsData {
  totalUsers: number;
  subscribedUsers: number;
  totalRevenue: number;
  onboarding: {
    totalCompleted: number;
    ageStats: StatItem[];
    genderStats: StatItem[];
    goalStats: StatItem[];
    levelStats: StatItem[];
    skillStats: StatItem[];
    timeStats: StatItem[];
  };
}

function StatBarGroup({ title, items, color = "bg-[#1A73E8]" }: { title: string; items: StatItem[]; color?: string }) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-[22px] p-5 shadow-soft border border-slate-100">
        <h3 className="font-bold text-slate-800 text-sm mb-3">{title}</h3>
        <p className="text-xs text-slate-400">Ma''lumot mavjud emas</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[22px] p-5 shadow-soft border border-slate-100 flex flex-col">
      <h3 className="font-bold text-slate-800 text-sm mb-4">{title}</h3>
      <div className="space-y-3 flex-1">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700 truncate max-w-[200px]" title={item.label}>
                {item.label}
              </span>
              <span className="text-slate-500 shrink-0">
                {item.count} ta <span className="text-slate-400">({item.pct}%)</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(item.pct, 2)}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full ${color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data.data);
    } catch {
      toast.error("Statistikalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportReportToPdf();
      toast.success("PDF hisobot yuklab olindi!");
    } catch (err: any) {
      toast.error("PDF yaratishda xatolik yuz berdi");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Statistika va Hisobotlar</h1>
          <p className="text-slate-500 text-sm mt-1">
            Foydalanuvchilar va onboarding so''rovnoma tahlili
          </p>
        </div>

        <button
          onClick={handleExportPdf}
          disabled={exportingPdf || loading}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#1A73E8] to-[#1557B0] text-white font-bold text-sm shadow-[0_4px_14px_rgba(26,115,232,0.35)] hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {exportingPdf ? (
            <SpinnerGap size={18} className="animate-spin" />
          ) : (
            <FilePdf size={18} weight="bold" />
          )}
          <span>{exportingPdf ? "PDF tayyorlanmoqda..." : "PDF hisobot yuklab olish"}</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-[22px] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-[22px] p-5 shadow-soft border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Users size={22} weight="bold" />
              </div>
              <div className="text-2xl font-black text-slate-800">
                {stats?.totalUsers?.toLocaleString() ?? 0}
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Jami foydalanuvchilar</div>
            </div>

            <div className="bg-white rounded-[22px] p-5 shadow-soft border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle size={22} weight="bold" />
              </div>
              <div className="text-2xl font-black text-slate-800">
                {stats?.subscribedUsers?.toLocaleString() ?? 0}
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Aktiv obunachilar</div>
            </div>

            <div className="bg-white rounded-[22px] p-5 shadow-soft border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <CreditCard size={22} weight="bold" />
              </div>
              <div className="text-2xl font-black text-slate-800">
                {stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString()} so''m` : "0 so''m"}
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Jami tasdiqlangan tushum</div>
            </div>

            <div className="bg-white rounded-[22px] p-5 shadow-soft border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <ChartBar size={22} weight="bold" />
              </div>
              <div className="text-2xl font-black text-slate-800">
                {stats?.onboarding?.totalCompleted ?? 0}
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1">So''rovnomani to''ldirganlar</div>
            </div>
          </div>

          {/* Onboarding Section Title */}
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-800">Onboarding So''rovnoma Tahlili</h2>
            <p className="text-xs text-slate-500">
              Jami {stats?.onboarding?.totalCompleted ?? 0} nafar o''quvchi javoblari asosida
            </p>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatBarGroup
              title="🎯 O''rganish Maqsadlari"
              items={stats?.onboarding?.goalStats ?? []}
              color="bg-[#1A73E8]"
            />
            <StatBarGroup
              title="⚡ Kuchaytirmoqchi bo''lgan ko''nikmalar"
              items={stats?.onboarding?.skillStats ?? []}
              color="bg-emerald-500"
            />
            <StatBarGroup
              title="📊 Hozirgi daraja (o''z bahosi)"
              items={stats?.onboarding?.levelStats ?? []}
              color="bg-purple-500"
            />
            <StatBarGroup
              title="🎂 Yosh guruhlari"
              items={stats?.onboarding?.ageStats ?? []}
              color="bg-amber-500"
            />
            <StatBarGroup
              title="👤 Jins taqsimoti"
              items={stats?.onboarding?.genderStats ?? []}
              color="bg-rose-500"
            />
            <StatBarGroup
              title="⏱️ Kuniga ajratadigan vaqt"
              items={stats?.onboarding?.timeStats ?? []}
              color="bg-sky-500"
            />
          </div>
        </>
      )}
    </div>
  );
}
