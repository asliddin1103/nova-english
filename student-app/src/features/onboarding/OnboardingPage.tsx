import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding, OnboardingData } from "./useOnboarding";

// ── Savol konfiguratsiyalari
const AGE_OPTIONS = ["13–17", "18–24", "25–34", "35+"];
const GENDER_OPTIONS = ["Erkak", "Ayol"];
const GOAL_OPTIONS = [
  "IELTS/IDP topshirish uchun",
  "Chet elga o'qishga ketish uchun",
  "Ish/kasbiy rivojlanish uchun",
  "Chet elda ishlash/migratsiya uchun",
  "Shunchaki umumiy bilim uchun",
  "Ijtimoiy tarmoq/kontent uchun",
];
const LEVEL_OPTIONS = [
  "Noldan boshlayman",
  "Boshlang'ich",
  "O'rta",
  "Yaxshi",
];
const SKILL_OPTIONS = [
  "Gapirish (Speaking)",
  "Yozish (Writing)",
  "Tinglab tushunish (Listening)",
  "O'qish (Reading)",
  "Grammatika",
  "So'z boyligi (Vocabulary)",
];
const TIME_OPTIONS = [
  "15 daqiqadan kam",
  "15–30 daqiqa",
  "30–60 daqiqa",
  "1 soatdan ko'p",
];

interface Props {
  initial?: Partial<OnboardingData>;
  onComplete: () => void;
  onSkip: () => void;
}

// ── Single select component
function SingleSelect({ options, value, onChange, cols = 2 }: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  cols?: number;
}) {
  return (
    <div className={`grid gap-2.5`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(selected ? "" : opt)}
            className={`
              relative py-3 px-4 rounded-2xl text-sm font-semibold text-left transition-all
              border-2 active:scale-[0.97]
              ${selected
                ? "border-[#1A73E8] bg-[#1A73E8]/10 text-[#1A73E8]"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }
            `}
          >
            {selected && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#1A73E8] flex items-center justify-center">
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Multi select component
function MultiSelect({ options, values, onChange, cols = 2 }: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
  cols?: number;
}) {
  const toggle = (opt: string) => {
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
    else onChange([...values, opt]);
  };
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map((opt) => {
        const selected = values.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`
              relative py-3 px-4 rounded-2xl text-sm font-semibold text-left transition-all
              border-2 active:scale-[0.97]
              ${selected
                ? "border-[#1A73E8] bg-[#1A73E8]/10 text-[#1A73E8]"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }
            `}
          >
            {selected && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#1A73E8] flex items-center justify-center">
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Screen 1: Yosh + Jins
function Screen1({ data, onChange }: { data: Partial<OnboardingData>; onChange: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-bold text-[#1A73E8] uppercase tracking-widest mb-1">Savol 1</p>
        <h3 className="text-lg font-black text-[#0A1628] mb-4">Yoshingiz qancha?</h3>
        <SingleSelect
          options={AGE_OPTIONS}
          value={data.ageGroup ?? ""}
          onChange={(v) => onChange({ ...data, ageGroup: v })}
          cols={2}
        />
      </div>
      <div>
        <p className="text-xs font-bold text-[#1A73E8] uppercase tracking-widest mb-1">Savol 2</p>
        <h3 className="text-lg font-black text-[#0A1628] mb-4">Jinsingiz?</h3>
        <SingleSelect
          options={GENDER_OPTIONS}
          value={data.gender ?? ""}
          onChange={(v) => onChange({ ...data, gender: v })}
          cols={2}
        />
      </div>
    </div>
  );
}

// ── Screen 2: Maqsad + Daraja
function Screen2({ data, onChange }: { data: Partial<OnboardingData>; onChange: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-bold text-[#1A73E8] uppercase tracking-widest mb-1">Savol 3</p>
        <h3 className="text-lg font-black text-[#0A1628] mb-1">Ingliz tilini nima uchun o'rganasiz?</h3>
        <p className="text-xs text-slate-500 mb-4">Bir nechta tanlashingiz mumkin</p>
        <MultiSelect
          options={GOAL_OPTIONS}
          values={data.goals ?? []}
          onChange={(v) => onChange({ ...data, goals: v })}
          cols={1}
        />
      </div>
      <div>
        <p className="text-xs font-bold text-[#1A73E8] uppercase tracking-widest mb-1">Savol 4</p>
        <h3 className="text-lg font-black text-[#0A1628] mb-4">Hozirgi darajangiz?</h3>
        <SingleSelect
          options={LEVEL_OPTIONS}
          value={data.currentLevel ?? ""}
          onChange={(v) => onChange({ ...data, currentLevel: v })}
          cols={2}
        />
      </div>
    </div>
  );
}

// ── Screen 3: Ko'nikmalar + Vaqt
function Screen3({ data, onChange }: { data: Partial<OnboardingData>; onChange: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-bold text-[#1A73E8] uppercase tracking-widest mb-1">Savol 5</p>
        <h3 className="text-lg font-black text-[#0A1628] mb-1">Qaysi ko'nikmalarni kuchaytirmoqchisiz?</h3>
        <p className="text-xs text-slate-500 mb-4">Bir nechta tanlashingiz mumkin</p>
        <MultiSelect
          options={SKILL_OPTIONS}
          values={data.skills ?? []}
          onChange={(v) => onChange({ ...data, skills: v })}
          cols={2}
        />
      </div>
      <div>
        <p className="text-xs font-bold text-[#1A73E8] uppercase tracking-widest mb-1">Savol 6 — Ixtiyoriy</p>
        <h3 className="text-lg font-black text-[#0A1628] mb-4">Kuniga qancha vaqt ajrata olasiz?</h3>
        <SingleSelect
          options={TIME_OPTIONS}
          value={data.dailyTime ?? ""}
          onChange={(v) => onChange({ ...data, dailyTime: v })}
          cols={2}
        />
      </div>
    </div>
  );
}

export default function OnboardingPage({ initial = {}, onComplete, onSkip }: Props) {
  const { complete, savePartial, skip } = useOnboarding();
  const [screen, setScreen] = useState(0); // 0, 1, 2
  const [data, setData] = useState<Partial<OnboardingData>>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = ilgari, -1 = orqaga

  const SCREENS = [Screen1, Screen2, Screen3];
  const SCREEN_TITLES = [
    "Siz haqingizda",
    "Maqsad va daraja",
    "Ko'nikmalar va vaqt",
  ];
  const TOTAL = SCREENS.length;
  const CurrentScreen = SCREENS[screen];

  const canProceed = () => {
    if (screen === 0) return !!data.ageGroup && !!data.gender;
    if (screen === 1) return (data.goals?.length ?? 0) > 0 && !!data.currentLevel;
    return true; // Screen 3 ixtiyoriy
  };

  const handleNext = async () => {
    // Qisman saqlash
    savePartial(data).catch(() => {});

    if (screen < TOTAL - 1) {
      setDirection(1);
      setScreen((s) => s + 1);
    } else {
      // Yakunlash
      setSubmitting(true);
      try {
        await complete(data as OnboardingData);
      } catch {
        // Xatolik bo'lsa ham foydalanuvchini o'tkazish
      } finally {
        setSubmitting(false);
        onComplete();
      }
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setScreen((s) => s - 1);
  };

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  };

  return (
    <div className="fixed inset-0 bg-[#F8FAFF] z-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-5 pt-10 pb-5">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-5">
          {SCREENS.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-200"
            >
              <motion.div
                className="h-full bg-[#1A73E8] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: i <= screen ? "100%" : "0%" }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">
              {screen + 1} / {TOTAL}
            </p>
            <h2 className="text-xl font-black text-[#0A1628]">{SCREEN_TITLES[screen]}</h2>
          </div>
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(26,115,232,0.25)] border border-slate-100 bg-white">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={screen}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <CurrentScreen data={data} onChange={setData} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-100 px-5 py-4 pb-8">
        <div className="flex gap-3">
          {screen > 0 ? (
            <button
              onClick={handleBack}
              className="flex-none px-5 py-3.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm"
            >
              ← Orqaga
            </button>
          ) : (
            <button
              onClick={() => {
                skip();
                onSkip();
              }}
              className="flex-none px-5 py-3.5 rounded-2xl bg-slate-100 text-slate-500 font-bold text-sm"
            >
              O'tkazib yuborish
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={!canProceed() || submitting}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#1A73E8] to-[#1557B0] text-white font-bold text-sm
              shadow-[0_4px_14px_rgba(26,115,232,0.4)] disabled:opacity-50 disabled:shadow-none
              flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {submitting ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : screen === TOTAL - 1 ? (
              "Boshlash 🚀"
            ) : (
              "Keyingisi →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
