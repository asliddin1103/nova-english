import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PencilLine, Microphone, Coin, Clock, CheckCircle } from "@phosphor-icons/react";
import api from "../../services/api";

const TYPE_ICONS: Record<string, string> = { VOCABULARY: "📖", GRAMMAR: "✍️", IELTS_LISTENING: "🎧", IELTS_READING: "📚", IELTS_WRITING: "✏️", IELTS_SPEAKING: "🎤", SPEAKING: "🎤" };
const AUTO_TYPES = ["VOCABULARY", "GRAMMAR", "IELTS_LISTENING", "IELTS_READING"];

export default function TestsPage({ isSubscribed }: { isSubscribed: boolean }) {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/tests").then(res => setTests(res.data.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openTest = async (test: any) => {
    const res = await api.get(`/tests/${test.id}`);
    const data = res.data.data;
    setActiveTest(data);
    setQuestions(data.questions ?? []);
    setAnswers({});
    setResult(null);
  };

  const submitTest = async () => {
    if (!activeTest) return;
    setSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([qId, ans]) => ({ questionId: parseInt(qId), answer: ans }));
      const res = await api.post(`/tests/${activeTest.id}/submit`, { answers: payload });
      setResult(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.error?.message ?? "Xatolik yuz berdi");
    } finally { setSubmitting(false); }
  };

  const isAuto = activeTest && AUTO_TYPES.includes(activeTest.type);

  return (
    <div className="flex flex-col h-full pb-24">
      <div className="flex-1 overflow-y-auto px-4 pt-4 flex flex-col gap-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-[20px] animate-pulse" />)
        ) : tests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <PencilLine size={56} weight="light" />
            <p className="text-sm font-medium">Hech qanday test topilmadi</p>
          </div>
        ) : tests.map((test, i) => (
          <motion.div key={test.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            onClick={() => isSubscribed && openTest(test)}
            className={`bg-white rounded-[20px] p-4 shadow-soft border border-slate-100 cursor-pointer hover:shadow-md transition-all ${!isSubscribed ? "opacity-50" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shrink-0">
                {TYPE_ICONS[test.type] ?? "📝"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-800 truncate">{test.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {test.timeLimit && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Clock size={10} />{Math.round(test.timeLimit / 60)} min</span>}
                  {test.coinReward > 0 && <span className="text-[10px] text-amber-600 flex items-center gap-0.5 font-bold"><Coin size={10} weight="fill" />+{test.coinReward}</span>}
                  {AUTO_TYPES.includes(test.type)
                    ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded font-bold">Auto</span>
                    : <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded font-bold flex items-center gap-0.5"><Microphone size={10} />Qo''lda</span>}
                </div>
              </div>
              <div className="text-xs font-bold text-slate-400">{test._count?.questions ?? 0} savol</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Test Modal */}
      <AnimatePresence>
        {activeTest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col"
          >
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30 }}
              className="mt-auto bg-white rounded-t-[36px] max-h-[92vh] flex flex-col"
            >
              <div className="px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-slate-800 text-base">{activeTest.title}</h2>
                  <button onClick={() => { setActiveTest(null); setResult(null); }} className="text-slate-400 font-bold text-sm">Yopish</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {result ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-black text-2xl ${result.passed ? "nova-gradient" : "bg-red-500"}`}>
                      {Math.round(result.score * 100)}%
                    </div>
                    <h3 className="font-bold text-xl text-slate-800">{result.passed ? "🎉 Muvaffaqiyat!" : "😔 Muvaffaqiyatsiz"}</h3>
                    <p className="text-sm text-slate-500 text-center">{result.correctCount}/{result.totalQuestions} savol to''g''ri</p>
                    {result.coinsEarned > 0 && (
                      <div className="flex items-center gap-2 text-amber-600 font-bold">
                        <Coin size={20} weight="fill" className="text-[#FFC107]" />
                        +{result.coinsEarned} NovaCoin qo''shildi!
                      </div>
                    )}
                    <button onClick={() => { setActiveTest(null); setResult(null); }} className="mt-4 w-full py-4 nova-gradient text-white rounded-[20px] font-bold">Yopish</button>
                  </div>
                ) : isAuto ? (
                  <div className="flex flex-col gap-5">
                    {questions.map((q: any, qi: number) => (
                      <div key={q.id}>
                        <p className="font-semibold text-sm text-slate-800 mb-3">{qi + 1}. {q.text}</p>
                        {(q.options as { id: string; text: string }[])?.map(opt => (
                          <button key={opt.id} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                            className={`w-full text-left px-4 py-3 rounded-[14px] mb-2 text-sm font-medium border-2 transition-all ${answers[q.id] === opt.id ? "border-[#1A73E8] bg-blue-50 text-[#1A73E8]" : "border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-200"}`}
                          >
                            <span className="font-black mr-2">{opt.id.toUpperCase()}.</span>{opt.text}
                          </button>
                        ))}
                      </div>
                    ))}
                    <button onClick={submitTest} disabled={submitting || Object.keys(answers).length < questions.length}
                      className="w-full py-4 nova-gradient text-white rounded-[20px] font-bold disabled:opacity-40 mt-2"
                    >
                      {submitting ? "Yuborilmoqda..." : `Javob berish (${Object.keys(answers).length}/${questions.length})`}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 py-4">
                    <p className="text-sm text-slate-600">{activeTest.description}</p>
                    <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-4 text-sm text-amber-800">
                      Bu test o''qituvchi tomonidan tekshiriladi. Yozma yoki audio javob yuboring.
                    </div>
                    <a href={`/api/v1/tests/${activeTest.id}/manual-submit`} className="w-full py-4 nova-gradient text-white rounded-[20px] font-bold text-center block">
                      Javob yuborish
                    </a>
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