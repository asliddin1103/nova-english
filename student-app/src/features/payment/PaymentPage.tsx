import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Camera, CheckCircle, Clock, XCircle, Upload, Copy, Check } from "@phosphor-icons/react";
import api from "../../services/api";

interface CardInfo { cardNumber: string; cardHolder: string; instructions: string[]; }

export default function PaymentPage() {
  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"info" | "upload" | "success">("info");
  const [amount, setAmount] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([api.get("/payments/card-info"), api.get("/payments/me")])
      .then(([cardRes, paymentsRes]) => {
        setCardInfo(cardRes.data.data);
        setPayments(paymentsRes.data.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (cardInfo?.cardNumber) {
      navigator.clipboard.writeText(cardInfo.cardNumber.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !amount) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("receipt", selectedFile);
      formData.append("amount", amount.replace(/\D/g, ""));
      await api.post("/payments/receipt", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setStep("success");
      const paymentsRes = await api.get("/payments/me");
      setPayments(paymentsRes.data.data ?? []);
    } catch (err: any) {
      alert(err.response?.data?.error?.message ?? "Xatolik yuz berdi. Qayta urinib ko''ring.");
    } finally { setUploading(false); }
  };

  const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    PENDING: { label: "Tekshirilmoqda", icon: <Clock size={16} weight="fill" className="text-amber-500" />, color: "bg-amber-50 border-amber-200 text-amber-700" },
    APPROVED: { label: "Tasdiqlandi", icon: <CheckCircle size={16} weight="fill" className="text-emerald-500" />, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    REJECTED: { label: "Rad etildi", icon: <XCircle size={16} weight="fill" className="text-red-500" />, color: "bg-red-50 border-red-200 text-red-700" },
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 rounded-full nova-gradient animate-spin border-4 border-transparent border-t-white" /></div>;

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28">
      {/* Card info */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-[#0A1628] to-[#0F2044] rounded-[28px] p-6 text-white relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-[#1A73E8]/20 rounded-full blur-3xl" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-[#FFC107]/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CreditCard size={22} weight="fill" className="text-[#FFC107]" />
              <span className="font-bold text-sm opacity-90">To''lov kartasi</span>
            </div>
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full font-medium">30 kun</span>
          </div>
          <div className="text-2xl font-black tracking-widest mb-1">{cardInfo?.cardNumber ?? "0000 0000 0000 0000"}</div>
          <div className="text-xs opacity-60 mb-5">{cardInfo?.cardHolder}</div>
          <button onClick={handleCopy} className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full font-bold transition-colors">
            {copied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
            {copied ? "Nusxalandi!" : "Raqamni nusxalash"}
          </button>
        </div>
      </motion.div>

      {/* Instructions */}
      <div className="bg-white rounded-[24px] p-5 shadow-soft border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <span className="text-base">📋</span> To''lov qilish tartibi
        </h3>
        <ol className="flex flex-col gap-2">
          {cardInfo?.instructions?.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
              <span className="shrink-0 w-6 h-6 rounded-full nova-gradient text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Upload section */}
      <AnimatePresence mode="wait">
        {step === "info" && (
          <motion.button key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setStep("upload")}
            className="w-full py-4 nova-gradient text-white rounded-[20px] font-bold text-sm flex items-center justify-center gap-2 shadow-glow-blue"
          >
            <Camera size={20} weight="fill" />
            Chek rasmini yuklash
          </motion.button>
        )}

        {step === "upload" && (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-[24px] p-5 shadow-soft border border-slate-100 flex flex-col gap-4"
          >
            <h3 className="font-bold text-slate-800">Chek yuklamoq</h3>

            {/* Amount input */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">To''lov summasi (so''m)</label>
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="150000"
                className="w-full px-4 py-3 border border-slate-200 rounded-[16px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
              />
            </div>

            {/* File upload area */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-[20px] p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-[#1A73E8] hover:bg-blue-50/50 transition-all"
            >
              {preview ? (
                <img src={preview} alt="Receipt preview" className="w-full max-h-48 object-contain rounded-xl" />
              ) : (
                <>
                  <Upload size={36} weight="light" className="text-slate-300" />
                  <span className="text-sm font-medium text-slate-500 text-center">Rasmni tanlash yoki kamera bilan olish</span>
                  <span className="text-xs text-slate-400">JPEG, PNG — max 10MB</span>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            <button
              onClick={handleUpload}
              disabled={!selectedFile || !amount || uploading}
              className="w-full py-4 nova-gradient text-white rounded-[20px] font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-blue flex items-center justify-center gap-2"
            >
              {uploading ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : "✅ Yuborish"}
            </button>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-emerald-50 rounded-[24px] p-8 flex flex-col items-center gap-3 border border-emerald-200"
          >
            <CheckCircle size={56} weight="fill" className="text-emerald-500" />
            <h3 className="font-bold text-emerald-800 text-lg text-center">Chek yuborildi!</h3>
            <p className="text-sm text-emerald-700 text-center">Admin 1-24 soat ichida tekshirib obunangizni faollashtiradi. Telegram orqali xabar olasiz.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-white rounded-[24px] p-5 shadow-soft border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-3">To''lovlar tarixi</h3>
          <div className="flex flex-col gap-2">
            {payments.map((p: any) => {
              const st = STATUS_MAP[p.status] ?? STATUS_MAP.PENDING;
              return (
                <div key={p.id} className={`flex items-center justify-between p-3 rounded-[14px] border ${st.color}`}>
                  <div className="flex items-center gap-2">{st.icon}<span className="text-xs font-bold">{st.label}</span></div>
                  <div className="text-right">
                    <div className="text-xs font-black">{p.amount?.toLocaleString()} so''m</div>
                    <div className="text-[10px] opacity-60">{new Date(p.createdAt).toLocaleDateString("uz-UZ")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}