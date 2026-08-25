import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Fire, Coin, Crown, BookOpen, CheckCircle, Lock, CreditCard } from "@phosphor-icons/react";
import { useStore } from "../../store/useStore";
import api from "../../services/api";

interface GamificationData {
  coins: { total: number } | null;
  streak: { currentStreak: number; longestStreak: number } | null;
}

export default function HomePage({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { user } = useStore();
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gamRes, lessRes] = await Promise.all([
          api.get("/gamification/me"),
          api.get("/lessons?limit=5"),
        ]);
        setGamification(gamRes.data.data);
        setLessons(lessRes.data.data?.slice(0, 4) ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const now = new Date();
  const isSubscribed = user?.isSubscribed && user?.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now;
  const daysLeft = isSubscribed
    ? Math.ceil((new Date(user.subscriptionExpiresAt).getTime() - now.getTime()) / 86400000)
    : 0;

  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28">
      {/* ── User greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-white rounded-[28px] p-4 shadow-soft border border-slate-100"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt="Avatar" className="w-14 h-14 rounded-full border-[3px] border-[#1A73E8] object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full border-[3px] border-[#1A73E8] nova-gradient flex items-center justify-center">
                <span className="text-white font-black text-xl">{user?.firstName?.[0] ?? "N"}</span>
              </div>
            )}
            <div className="absolute -bottom-1.5 -right-1.5 bg-[#FFC107] text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg border-2 border-white shadow-sm">
              {user?.languageLevel ?? "A1"}
            </div>
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800 leading-tight">{user?.firstName} {user?.lastName}</h2>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <Fire size={14} weight="fill" className="text-orange-500" />
              {gamification?.streak?.currentStreak ?? 0} kunlik seriya
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isSubscribed ? (
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg">
              {daysLeft} kun qoldi
            </span>
          ) : (
            <button
              onClick={() => onNavigate("profile")}
              className="text-[10px] font-bold bg-red-50 text-red-500 px-2.5 py-1 rounded-lg"
            >
              Obuna yo''q
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Streak + Coins cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-orange-400 to-amber-500 p-5 rounded-[28px] text-white shadow-lg shadow-orange-400/30 relative overflow-hidden group cursor-pointer"
          onClick={() => onNavigate("profile")}
        >
          <Fire size={90} weight="fill" className="absolute -right-5 -bottom-5 opacity-20 group-hover:scale-110 transition-transform duration-500" />
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-90">Streak</div>
          <div className="text-3xl font-black tracking-tight">{gamification?.streak?.currentStreak ?? 0}</div>
          <div className="text-[10px] opacity-75 mt-1">kun ketma-ket</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#1A73E8] to-[#1557B0] p-5 rounded-[28px] text-white shadow-lg shadow-blue-500/30 relative overflow-hidden group cursor-pointer"
          onClick={() => onNavigate("profile")}
        >
          <Coin size={90} weight="fill" className="absolute -right-5 -bottom-5 opacity-20 group-hover:scale-110 transition-transform duration-500" />
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-90">NovaCoin</div>
          <div className="text-3xl font-black tracking-tight">{gamification?.coins?.total ?? 0}</div>
          <div className="text-[10px] opacity-75 mt-1">umumiy coin</div>
        </motion.div>
      </div>

      {/* ── Subscription banner if not subscribed */}
      {!isSubscribed && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onNavigate("profile")}
          className="w-full bg-gradient-to-br from-[#0A1628] to-[#0F2044] rounded-[28px] p-5 text-white text-left relative overflow-hidden"
        >
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#1A73E8]/20 rounded-full blur-3xl" />
          <div className="flex items-center gap-3 relative z-10">
            <CreditCard size={28} weight="fill" className="text-[#FFC107] shrink-0" />
            <div>
              <div className="font-bold text-sm">Kursga ulanish uchun to''lov qiling</div>
              <div className="text-xs text-slate-400 mt-0.5">Chek yuklab admin tasdiqlaydi → obuna faollashadi</div>
            </div>
          </div>
        </motion.button>
      )}

      {/* ── Progress section */}
      {lessons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-[28px] p-5 shadow-soft border border-slate-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BookOpen size={20} weight="fill" className="text-[#1A73E8]" />
              So''nggi darslar
            </h3>
            <button onClick={() => onNavigate("lessons")} className="text-xs font-bold text-[#1A73E8]">
              Barchasi →
            </button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>{completedCount}/{lessons.length} tugallandi</span>
              <span className="font-bold text-[#1A73E8]">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#1A73E8] to-[#4A9EF5] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-[16px] border border-slate-100">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${lesson.isCompleted ? "bg-emerald-100" : "bg-slate-200"}`}>
                  {lesson.isCompleted
                    ? <CheckCircle size={18} weight="fill" className="text-emerald-500" />
                    : <Lock size={18} weight="fill" className="text-slate-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-800 truncate">{lesson.title}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">{lesson.level} • {lesson.category}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Leaderboard teaser */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => onNavigate("profile")}
        className="w-full bg-gradient-to-br from-amber-400 to-orange-500 rounded-[28px] p-5 text-white relative overflow-hidden group"
      >
        <Crown size={80} weight="fill" className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform" />
        <div className="flex items-center gap-3 relative z-10">
          <Crown size={28} weight="fill" className="text-white shrink-0" />
          <div className="text-left">
            <div className="font-bold text-sm">Liderlar Doskasi</div>
            <div className="text-[11px] opacity-85 mt-0.5">Top o''quvchilar coin reytingi bo''yicha</div>
          </div>
        </div>
      </motion.button>
    </div>
  );
}