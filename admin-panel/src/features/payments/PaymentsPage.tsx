import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Image, Clock } from "@phosphor-icons/react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [tab, setTab] = useState<"pending" | "all">("pending");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const url = tab === "pending" ? "/payments/admin/pending" : "/payments/admin";
      const res = await api.get(url);
      setPayments(tab === "pending" ? res.data.data : res.data.data);
    } catch { setPayments([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, [tab]);

  const handleApprove = async (id: number) => {
    setProcessing(true);
    try {
      await api.post(`/payments/admin/${id}/approve`);
      toast.success("To''lov tasdiqlandi! Obuna faollashtirildi.");
      setSelected(null);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Xatolik");
    } finally { setProcessing(false); }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) { toast.error("Rad etish sababini kiriting"); return; }
    setProcessing(true);
    try {
      await api.post(`/payments/admin/${id}/reject`, { reason: rejectReason });
      toast.success("To''lov rad etildi");
      setSelected(null); setRejectReason("");
      fetchPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Xatolik");
    } finally { setProcessing(false); }
  };

  const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">To''lovlar</h1>
          <p className="text-slate-500 text-sm mt-1">Chek rasmlarini tekshirish va tasdiqlash</p>
        </div>
        <div className="flex gap-2">
          {["pending", "all"].map(t => (
            <button key={t} onClick={() => setTab(t as any)}
              className={`px-4 py-2 rounded-[14px] text-sm font-bold transition-all ${tab === t ? "nova-gradient text-white" : "bg-white text-slate-600 border border-slate-200"}`}
            >
              {t === "pending" ? "⏳ Kutilmoqda" : "📋 Barchasi"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-white rounded-[20px] animate-pulse" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-[24px] p-12 text-center shadow-soft border border-slate-100">
          <CheckCircle size={48} weight="light" className="text-emerald-300 mx-auto mb-3" />
          <p className="font-bold text-slate-600">Hech qanday to''lov yo''q</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((p: any) => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => setSelected(p)}
              className="bg-white rounded-[20px] p-4 shadow-soft border border-slate-100 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Receipt thumbnail */}
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {p.receipt?.fileUrl
                    ? <img src={p.receipt.fileUrl} alt="receipt" className="w-full h-full object-cover" />
                    : <Image size={24} className="text-slate-300" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-800">
                    {p.user?.firstName} {p.user?.lastName}
                    {p.user?.username && <span className="text-slate-400 font-medium ml-1">@{p.user.username}</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    ID: {p.user?.telegramId} • {new Date(p.createdAt).toLocaleString("uz-UZ")}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-sm text-slate-800">{p.amount?.toLocaleString()} so''m</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[p.status]}`}>
                    {p.status === "PENDING" ? "Kutilmoqda" : p.status === "APPROVED" ? "Tasdiqlandi" : "Rad etildi"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !processing && setSelected(null)}
          >
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[28px] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-slate-800">To''lov #{selected.id}</h2>
                  <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">×</button>
                </div>

                {/* Receipt image */}
                {selected.receipt?.fileUrl && (
                  <a href={selected.receipt.fileUrl} target="_blank" rel="noopener noreferrer">
                    <img src={selected.receipt.fileUrl} alt="Receipt" className="w-full rounded-[20px] border border-slate-200 mb-5 max-h-80 object-contain bg-slate-50" />
                  </a>
                )}

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    ["Foydalanuvchi", `${selected.user?.firstName} ${selected.user?.lastName ?? ""}`],
                    ["Telegram ID", selected.user?.telegramId],
                    ["Summa", `${selected.amount?.toLocaleString()} so''m`],
                    ["Sana", new Date(selected.createdAt).toLocaleString("uz-UZ")],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-slate-50 rounded-[14px] p-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{k}</div>
                      <div className="font-semibold text-sm text-slate-800 mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>

                {selected.status === "PENDING" && (
                  <div className="flex flex-col gap-3">
                    <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      placeholder="Rad etish sababi (faqat rad etishda)"
                      className="px-4 py-3 border border-slate-200 rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => handleReject(selected.id)} disabled={processing}
                        className="py-3.5 bg-red-500 text-white rounded-[16px] font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processing ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <XCircle size={18} weight="fill" />}
                        Rad etish
                      </button>
                      <button onClick={() => handleApprove(selected.id)} disabled={processing}
                        className="py-3.5 nova-gradient text-white rounded-[16px] font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(26,115,232,0.4)]"
                      >
                        {processing ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <CheckCircle size={18} weight="fill" />}
                        Tasdiqlash
                      </button>
                    </div>
                  </div>
                )}

                {selected.status !== "PENDING" && (
                  <div className={`text-center py-4 rounded-[16px] font-bold text-sm ${STATUS_COLORS[selected.status]}`}>
                    {selected.status === "APPROVED" ? "✅ Bu to''lov tasdiqlangan" : `❌ Rad etildi: ${selected.rejectedReason}`}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};