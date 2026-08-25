import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Microphone, PencilLine, CheckCircle } from "@phosphor-icons/react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tests/admin/submissions/pending");
      setSubmissions(res.data.data ?? []);
    } catch { setSubmissions([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const handleReview = async (reject = false) => {
    if (!feedback.trim()) { toast.error("Feedback kiriting"); return; }
    setProcessing(true);
    try {
      await api.post(`/tests/admin/submissions/${selected.id}/review`, { feedback, score, reject });
      toast.success(reject ? "Topshiriq rad etildi" : "Feedback yuborildi!");
      setSelected(null); setFeedback(""); setScore("");
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Xatolik");
    } finally { setProcessing(false); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Topshiriqlar</h1>
        <p className="text-slate-500 text-sm mt-1">Talaba speaking/writing javoblarini tekshirish</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-[20px] animate-pulse" />)}</div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-[24px] p-12 text-center shadow-soft border border-slate-100">
          <CheckCircle size={48} weight="light" className="text-emerald-300 mx-auto mb-3" />
          <p className="font-bold text-slate-600">Barcha topshiriqlar tekshirildi</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {submissions.map((s: any) => (
            <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => { setSelected(s); setFeedback(""); setScore(""); }}
              className="bg-white rounded-[20px] p-4 shadow-soft border border-slate-100 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
                  {s.type === "AUDIO" ? <Microphone size={20} weight="fill" className="text-purple-600" /> : <PencilLine size={20} weight="fill" className="text-purple-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-800">{s.test?.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {s.user?.firstName} {s.user?.lastName} • {new Date(s.submittedAt).toLocaleString("uz-UZ")}
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full shrink-0">Kutilmoqda</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Review modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !processing && setSelected(null)}
          >
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[28px] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between mb-4">
                  <h2 className="font-bold text-slate-800">{selected.test?.title}</h2>
                  <button onClick={() => setSelected(null)} className="text-slate-400 text-xl font-bold">×</button>
                </div>
                <div className="bg-slate-50 rounded-[20px] p-4 mb-4">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">Talaba javobi</div>
                  {selected.type === "AUDIO" && selected.fileUrl ? (
                    <audio controls src={selected.fileUrl} className="w-full" />
                  ) : selected.content ? (
                    <p className="text-sm text-slate-700 leading-relaxed">{selected.content}</p>
                  ) : selected.fileUrl ? (
                    <a href={selected.fileUrl} target="_blank" className="text-blue-600 text-sm font-bold underline">Faylni ochish →</a>
                  ) : <p className="text-sm text-slate-400 italic">Fayl topilmadi</p>}
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Baho (ixtiyoriy, masalan: "Band 6.5", "8/10")</label>
                    <input value={score} onChange={e => setScore(e.target.value)} placeholder="masalan: Band 6.5"
                      className="w-full px-4 py-3 border border-slate-200 rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Feedback *</label>
                    <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4}
                      placeholder="Talabaga batafsil feedback bering..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8] resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleReview(true)} disabled={processing}
                      className="py-3.5 bg-red-500 text-white rounded-[16px] font-bold text-sm disabled:opacity-50"
                    >Rad etish</button>
                    <button onClick={() => handleReview(false)} disabled={processing}
                      className="py-3.5 nova-gradient text-white rounded-[16px] font-bold text-sm disabled:opacity-50 shadow-[0_4px_14px_rgba(26,115,232,0.4)]"
                    >✅ Tasdiqlash</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}