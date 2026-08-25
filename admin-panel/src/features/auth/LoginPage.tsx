import { useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { useAdminStore } from "../../store/useAdminStore";

export default function LoginPage() {
  const { setAuth } = useAdminStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api.post("/auth/admin/login", { email, password });
      const { token, staff } = res.data.data;
      setAuth(staff, token);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Login yoki parol noto''g''ri");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#0F2044] to-[#0A1628] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl nova-gradient flex items-center justify-center">
            <span className="text-white font-black text-xl">N</span>
          </div>
          <div>
            <span className="font-black text-2xl text-[#0A1628]">NOVA</span>
            <span className="font-black text-2xl text-[#FFC107]"> ENGLISH</span>
            <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Admin Panel</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 font-medium"
            >
              ❌ {error}
            </motion.div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Email</label>
            <input type="email" id="admin-email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="admin@novaenglish.uz"
              className="w-full px-4 py-3.5 border border-slate-200 rounded-[16px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1A73E8] transition"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Parol</label>
            <input type="password" id="admin-password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full px-4 py-3.5 border border-slate-200 rounded-[16px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1A73E8] transition"
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-4 nova-gradient text-white rounded-[16px] font-bold text-sm mt-2 disabled:opacity-60 transition-all shadow-[0_4px_20px_rgba(26,115,232,0.4)] hover:shadow-[0_6px_24px_rgba(26,115,232,0.5)]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Kirish...
              </span>
            ) : "Kirish →"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}