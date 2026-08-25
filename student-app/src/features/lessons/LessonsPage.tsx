import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Play, CheckCircle, Lock } from "@phosphor-icons/react";
import api from "../../services/api";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-500", A2: "bg-blue-500", B1: "bg-purple-500", B2: "bg-orange-500", C1: "bg-red-500"
};

export default function LessonsPage({ isSubscribed }: { isSubscribed: boolean }) {
  const [lessons, setLessons] = useState<any[]>([]);
  const [activeLevel, setActiveLevel] = useState("A1");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await api.get(`/lessons?level=${activeLevel}`);
        setLessons(res.data.data ?? []);
      } catch { setLessons([]); } finally { setLoading(false); }
    };
    setLoading(true);
    fetchLessons();
  }, [activeLevel]);

  const handleMarkComplete = async (lessonId: number) => {
    try {
      await api.post(`/lessons/${lessonId}/progress`, { watchedSecs: 0 });
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, isCompleted: true } : l));
      setSelected(null);
    } catch {}
  };

  return (
    <div className="flex flex-col h-full pb-24">
      {/* Level tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-3 overflow-x-auto hide-scrollbar shrink-0">
        {LEVELS.map(level => (
          <button
            key={level}
            onClick={() => setActiveLevel(level)}
            className={`shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 ${
              activeLevel === level
                ? `${LEVEL_COLORS[level]} text-white shadow-lg scale-105`
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Lessons list */}
      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-[20px] animate-pulse" />
          ))
        ) : lessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <BookOpen size={56} weight="light" />
            <p className="font-medium text-sm text-center">Bu daraja uchun darslar hali yuklanmagan</p>
          </div>
        ) : (
          lessons.map((lesson, i) => {
            const locked = !isSubscribed && i > 2;
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => !locked && setSelected(lesson)}
                className={`bg-white rounded-[20px] p-4 shadow-soft border border-slate-100 transition-all ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:shadow-md hover:-translate-y-0.5"}`}
              >
                <div className="flex items-center gap-3">
                  {/* Thumbnail / thumbnail placeholder */}
                  <div className={`w-12 h-12 rounded-2xl ${LEVEL_COLORS[lesson.level] ?? "bg-slate-200"} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                    {lesson.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-800 truncate">{lesson.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{lesson.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{lesson.category}</span>
                      {lesson.durationSecs && (
                        <span className="text-[10px] text-slate-400">{Math.ceil(lesson.durationSecs / 60)} min</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {locked
                      ? <Lock size={22} weight="fill" className="text-slate-300" />
                      : lesson.isCompleted
                        ? <CheckCircle size={22} weight="fill" className="text-emerald-500" />
                        : <div className="w-9 h-9 rounded-full nova-gradient flex items-center justify-center shadow-glow-blue">
                            <Play size={16} weight="fill" className="text-white ml-0.5" />
                          </div>
                    }
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        {!isSubscribed && (
          <div className="bg-gradient-to-br from-[#0A1628] to-[#0F2044] text-white rounded-[20px] p-4 text-center mt-2">
            <Lock size={28} weight="fill" className="text-[#FFC107] mx-auto mb-2" />
            <p className="font-bold text-sm">Ko''proq darslar uchun obuna oling</p>
            <p className="text-xs text-slate-400 mt-1">3 ta dars tekin, qolganlarini ochish uchun to''lov qiling</p>
          </div>
        )}
      </div>

      {/* Lesson Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="mt-auto bg-white rounded-t-[36px] p-6 pb-10 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl ${LEVEL_COLORS[selected.level] ?? "bg-slate-200"} flex items-center justify-center text-white font-black`}>
                  {selected.level}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">{selected.title}</h2>
                  <p className="text-xs text-slate-500">{selected.category}</p>
                </div>
              </div>
              {selected.description && (
                <p className="text-sm text-slate-600 mb-5 leading-relaxed">{selected.description}</p>
              )}
              {/* YouTube embed */}
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 mb-5">
                <iframe
                  src={`https://www.youtube.com/embed/${selected.youtubeId}`}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              <button
                onClick={() => handleMarkComplete(selected.id)}
                disabled={selected.isCompleted}
                className={`w-full py-4 rounded-[20px] font-bold text-sm transition-all ${
                  selected.isCompleted
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "nova-gradient text-white shadow-glow-blue"
                }`}
              >
                {selected.isCompleted ? "✅ Tugallangan" : "✅ Darsni tugalladim"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}