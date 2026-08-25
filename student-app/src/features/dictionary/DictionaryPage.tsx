import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MagnifyingGlass, BookBookmark } from "@phosphor-icons/react";
import api from "../../services/api";

export default function DictionaryPage() {
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!search && words.length === 0) {
        setLoading(true);
        const res = await api.get("/dictionary?limit=30").catch(() => ({ data: { data: [] } }));
        setWords(res.data.data ?? []);
        setLoading(false);
        return;
      }
      if (search.length < 2) return;
      setLoading(true);
      const res = await api.get(`/dictionary?q=${search}&limit=30`).catch(() => ({ data: { data: [] } }));
      setWords(res.data.data ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex flex-col h-full pb-24">
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="relative">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="So''z qidiring (inglizcha yoki o''zbekcha)..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-[18px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8] shadow-soft"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-2">
        {loading ? [...Array(6)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-[20px] animate-pulse" />)
          : words.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <BookBookmark size={56} weight="light" />
              <p className="text-sm">So''z topilmadi</p>
            </div>
          ) : words.map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-[20px] p-4 shadow-soft border border-slate-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-black text-base text-[#1A73E8]">{w.word}</span>
                  {w.pronunciation && <span className="text-xs text-slate-400 ml-2 font-mono">{w.pronunciation}</span>}
                </div>
                {w.level && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold shrink-0">{w.level}</span>}
              </div>
              <p className="text-sm font-semibold text-slate-700 mt-1">{w.translation}</p>
              {w.definition && <p className="text-xs text-slate-400 mt-1 italic">{w.definition}</p>}
              {w.exampleSentence && (
                <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-xl p-2.5 border-l-2 border-[#1A73E8]">
                  <span className="font-bold">Misol: </span>{w.exampleSentence}
                </p>
              )}
            </motion.div>
          ))}
      </div>
    </div>
  );
}