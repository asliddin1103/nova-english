import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Books, MagnifyingGlass, Link, FilePdf, SpeakerHigh } from "@phosphor-icons/react";
import api from "../../services/api";

const TYPE_ICONS: Record<string, string> = {
  PDF: "📄",
  AUDIO: "🎧",
  LINK: "🔗",
  BOOK: "📚",
  VIDEO: "🎬",
};

export default function LibraryPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      api.get(`/library?q=${search}`).then(res => setResources(res.data.data ?? [])).catch(() => []).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex flex-col h-full pb-24">
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="relative">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Resurslarni qidiring..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-[18px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8] shadow-soft"
          />
        </div>
      </div>
      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3">
        {loading ? [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-[20px] animate-pulse" />)
          : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Books size={56} weight="light" />
              <p className="text-sm font-medium">Resurslar topilmadi</p>
            </div>
          ) : resources.map((r, i) => (
            <motion.a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white rounded-[20px] p-4 shadow-soft border border-slate-100 hover:shadow-md transition-all flex items-start gap-3"
            >
              <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 text-xl">
                {TYPE_ICONS[r.type] ?? "📁"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-800 truncate">{r.title}</h3>
                {r.description && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{r.description}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  {r.level && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">{r.level}</span>}
                  {r.tags?.slice(0, 2).map((t: string) => (
                    <span key={t} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#1A73E8] shrink-0 mt-1">{r.type}</span>
            </motion.a>
          ))}
      </div>
    </div>
  );
}