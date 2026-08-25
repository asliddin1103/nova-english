import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Fire, Coin, Trophy, Calendar, SignOut } from "@phosphor-icons/react";
import { useStore } from "../../store/useStore";
import api from "../../services/api";

export default function ProfilePage({ onPayment, onLeaderboard }: { onPayment: () => void; onLeaderboard: () => void }) {
  const { user, clearAuth } = useStore();
  const [leaderboard, setLeaderboard] = useState<{ top20: any[]; myRank: number } | null>(null);

  useEffect(() => {
    api.get("/gamification/leaderboard").then(res => setLeaderboard(res.data.data)).catch(() => {});
  }, []);

  const now = new Date();
  const isSubscribed = user?.isSubscribed && user?.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now;
  const expiryDate = user?.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString("uz-UZ") : null;

  const top3Colors = ["bg-yellow-400", "bg-slate-300", "bg-amber-600"];

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28">
      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#0A1628] to-[#0F2044] rounded-[28px] p-6 text-white relative overflow-hidden"
      >
        <div className="absolute -right-12 -top-12 w-44 h-44 bg-[#1A73E8]/20 rounded-full blur-3xl" />
        <div className="flex items-center gap-4 relative z-10 mb-5">
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt="Avatar" className="w-16 h-16 rounded-full border-[3px] border-[#1A73E8] object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full nova-gradient flex items-center justify-center border-[3px] border-[#1A73E8]">
              <span className="text-white font-black text-2xl">{user?.firstName?.[0] ?? "N"}</span>
            </div>
          )}
          <div>
            <h2 className="font-black text-xl">{user?.firstName} {user?.lastName}</h2>
            {user?.username && <p className="text-xs text-slate-400">@{user.username}</p>}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="bg-[#FFC107] text-[#0A1628] text-xs font-black px-2.5 py-0.5 rounded-full">{user?.languageLevel}</span>
              {isSubscribed
                ? <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">Aktiv</span>
                : <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-500/30">Obunasiz</span>}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 relative z-10">
          {[
            { icon: <Fire size={18} weight="fill" className="text-orange-400" />, label: "Streak", value: `${user?.streak?.currentStreak ?? 0} kun` },
            { icon: <Coin size={18} weight="fill" className="text-[#FFC107]" />, label: "Coins", value: user?.coins?.total ?? 0 },
            { icon: <Trophy size={18} weight="fill" className="text-purple-400" />, label: "Reyting", value: leaderboard ? `#${leaderboard.myRank}` : "—" },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 rounded-[16px] p-3 flex flex-col items-center gap-1">
              {s.icon}
              <div className="font-black text-sm">{s.value}</div>
              <div className="text-[10px] opacity-60">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Subscription status */}
      {!isSubscribed ? (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          onClick={onPayment}
          className="w-full py-4 gold-gradient text-white rounded-[20px] font-bold flex items-center justify-center gap-2 shadow-glow-gold"
        >
          <Crown size={22} weight="fill" />
          Obuna olish — Kursni ochish
        </motion.button>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-[20px] p-4 flex items-center gap-3">
          <Calendar size={22} weight="fill" className="text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold text-emerald-800 text-sm">Obuna faol</div>
            <div className="text-xs text-emerald-600 mt-0.5">Muddati: {expiryDate}</div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard && leaderboard.top20.length > 0 && (
        <div className="bg-white rounded-[24px] p-5 shadow-soft border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Trophy size={20} weight="fill" className="text-amber-500" />
            Liderlar Doskasi
          </h3>
          <div className="flex flex-col gap-2">
            {leaderboard.top20.slice(0, 10).map((entry: any) => (
              <div key={entry.userId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-[14px]">
                <div className={`w-7 h-7 rounded-full ${top3Colors[entry.rank - 1] ?? "bg-slate-200"} flex items-center justify-center text-xs font-black text-white`}>
                  {entry.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-800 truncate">
                    {entry.user?.firstName} {entry.user?.lastName}
                  </div>
                  {entry.user?.username && <div className="text-[10px] text-slate-400">@{entry.user.username}</div>}
                </div>
                <div className="flex items-center gap-1 text-sm font-black text-[#1A73E8]">
                  <Coin size={14} weight="fill" className="text-[#FFC107]" />
                  {entry.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <button onClick={clearAuth}
        className="flex items-center justify-center gap-2 py-3 rounded-[16px] border border-red-200 bg-red-50 text-red-500 font-bold text-sm transition-colors hover:bg-red-100"
      >
        <SignOut size={18} weight="bold" />
        Chiqish
      </button>
    </div>
  );
}