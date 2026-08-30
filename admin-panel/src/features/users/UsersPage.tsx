import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MagnifyingGlass, Fire, Coin, CheckCircle, FileXls, SpinnerGap } from "@phosphor-icons/react";
import api from "../../services/api";
import { exportUsersToExcel } from "../../services/exportService";
import toast from "react-hot-toast";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [subFilter, setSubFilter] = useState<string>("all"); // "all" | "true" | "false"
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `/admin/users?q=${encodeURIComponent(search)}&page=${page}&limit=20`;
      if (subFilter !== "all") {
        url += `&isSubscribed=${subFilter}`;
      }
      const res = await api.get(url);
      setUsers(res.data.data ?? []);
      setMeta(res.data.meta);
    } catch { setUsers([]); } finally { setLoading(false); }
  };

  useEffect(() => { setPage(1); }, [search, subFilter]);
  useEffect(() => { fetchUsers(); }, [search, subFilter, page]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportUsersToExcel({
        q: search,
        isSubscribed: subFilter !== "all" ? subFilter : undefined,
      });
      toast.success("Foydalanuvchilar ro''yxati Excel formatda yuklandi!");
    } catch (err: any) {
      toast.error("Excel eksport qilishda xatolik yuz berdi");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Foydalanuvchilar</h1>
          <p className="text-slate-500 text-sm mt-1">{meta?.total ?? "?"} ta ro''yxatdan o''tgan</p>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-[0_4px_14px_rgba(5,150,105,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {exporting ? (
            <SpinnerGap size={18} className="animate-spin" />
          ) : (
            <FileXls size={18} weight="bold" />
          )}
          <span>{exporting ? "Eksport qilinmoqda..." : "Excel yuklab olish"}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ism, username yoki Telegram ID..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-[18px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8] shadow-soft"
          />
        </div>

        <div className="flex gap-1.5 bg-white p-1 rounded-[18px] border border-slate-200 shadow-soft">
          {[
            { id: "all", label: "Barchasi" },
            { id: "true", label: "Obunachilar" },
            { id: "false", label: "Obunasiz" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSubFilter(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                subFilter === f.id
                  ? "bg-[#1A73E8] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[24px] shadow-soft border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Foydalanuvchi", "Telegram ID", "Daraja", "Obuna", "Streak", "Coins", "Qo''shilgan"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>)}
                    </tr>
                  ))
                : users.map((u: any) => (
                    <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full nova-gradient flex items-center justify-center text-white text-xs font-black shrink-0">
                            {u.firstName?.[0] ?? "?"}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-slate-800">{u.firstName} {u.lastName}</div>
                            {u.username && <div className="text-[10px] text-slate-400">@{u.username}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">{u.telegramId}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{u.languageLevel}</span>
                      </td>
                      <td className="px-4 py-3">
                        {u.isSubscribed
                          ? <CheckCircle size={18} weight="fill" className="text-emerald-500" />
                          : <span className="text-[11px] text-slate-400 font-medium">Yo''q</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold flex items-center gap-1 text-orange-500">
                          <Fire size={12} weight="fill" />{u.streak?.currentStreak ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold flex items-center gap-1 text-amber-600">
                          <Coin size={12} weight="fill" className="text-[#FFC107]" />{u.coins?.total ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString("uz-UZ")}
                      </td>
                    </motion.tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">{meta.page}/{meta.totalPages} sahifa</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 disabled:opacity-40">← Oldingi</button>
              <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold nova-gradient text-white disabled:opacity-40">Keyingi →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}