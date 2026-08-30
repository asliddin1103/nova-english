import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";

import { useTelegramAuth } from "./features/auth/useTelegramAuth";
import { useStore } from "./store/useStore";
import { useOnboarding } from "./features/onboarding/useOnboarding";
import OnboardingPage from "./features/onboarding/OnboardingPage";

import TopBar from "./components/layout/TopBar";
import BottomNav from "./components/layout/BottomNav";
import HomePage from "./features/home/HomePage";
import LessonsPage from "./features/lessons/LessonsPage";
import TestsPage from "./features/tests/TestsPage";
import LibraryPage from "./features/library/LibraryPage";
import DictionaryPage from "./features/dictionary/DictionaryPage";
import PaymentPage from "./features/payment/PaymentPage";
import ProfilePage from "./features/profile/ProfilePage";

type Tab = "home" | "lessons" | "tests" | "library" | "profile";

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#0A1628] flex flex-col items-center justify-center gap-6">
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-24 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(26,115,232,0.4)] border-2 border-white/10 bg-white p-1"
      >
        <img src="/logo.jpg" alt="Nova English Logo" className="w-full h-full object-cover rounded-2xl" />
      </motion.div>
      <div>
        <span className="font-black text-2xl text-white tracking-tight">NOVA</span>
        <span className="font-black text-2xl text-[#FFC107] tracking-tight"> ENGLISH</span>
      </div>
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-2 h-2 rounded-full bg-[#1A73E8]"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 bg-[#0A1628] flex flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="text-4xl">😞</div>
      <h2 className="text-white font-bold text-lg">Ulanishda xatolik</h2>
      <p className="text-slate-400 text-sm">{message}</p>
      <button onClick={() => window.location.reload()} className="mt-4 px-6 py-3 nova-gradient text-white rounded-[16px] font-bold text-sm">
        Qayta urinish
      </button>
    </div>
  );
}

const PAGE_TITLES: Record<Tab, string> = {
  home: "Bosh sahifa",
  lessons: "Darslar",
  tests: "Testlar",
  library: "Kutubxona",
  profile: "Profil",
};

export default function App() {
  const { loading, error } = useTelegramAuth();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showPayment, setShowPayment] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const { status, checkStatus } = useOnboarding();

  useEffect(() => {
    if (!loading && user) {
      if (user.onboardingCompleted) {
        setShowOnboarding(false);
        setOnboardingChecked(true);
        return;
      }

      checkStatus().then((res) => {
        setShowOnboarding(!res.isCompleted);
        setOnboardingChecked(true);
      }).catch(() => {
        setOnboardingChecked(true);
      });
    }
  }, [loading, user?.id, user?.onboardingCompleted, checkStatus]);

  const isSubscribed = !!(
    user?.isSubscribed &&
    user?.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt) > new Date()
  );

  if (loading || (user && !onboardingChecked)) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  if (showOnboarding) {
    return (
      <OnboardingPage
        initial={status?.partial || {}}
        onComplete={() => setShowOnboarding(false)}
        onSkip={() => setShowOnboarding(false)}
      />
    );
  }

  if (showPayment) {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto overflow-hidden bg-slate-50">
        <TopBar title="To''lov" showLogo={false} />
        <div className="flex-1 overflow-y-auto">
          <PaymentPage />
        </div>
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <button
            onClick={() => setShowPayment(false)}
            className="pointer-events-auto px-6 py-2.5 bg-white text-slate-600 rounded-full font-bold text-sm shadow-soft border border-slate-200"
          >
            ← Orqaga
          </button>
        </div>
      </div>
    );
  }

  const pageVariants = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto overflow-hidden bg-slate-50">
      <Toaster position="top-center" toastOptions={{ duration: 2500, style: { borderRadius: "16px", fontWeight: 600, fontSize: "13px" } }} />

      {/* Top Bar */}
      <TopBar showLogo={activeTab === "home"} title={activeTab !== "home" ? PAGE_TITLES[activeTab] : undefined} />

      {/* Pages */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} variants={pageVariants} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.18 }} className="absolute inset-0 overflow-y-auto"
          >
            {activeTab === "home" && <HomePage onNavigate={(tab) => {
              if (tab === "profile") setActiveTab("profile");
              else setActiveTab(tab as Tab);
            }} />}
            {activeTab === "lessons" && <LessonsPage isSubscribed={isSubscribed} />}
            {activeTab === "tests" && <TestsPage isSubscribed={isSubscribed} />}
            {activeTab === "library" && (
              <div>
                <div className="flex justify-center gap-2 pt-4 px-4">
                  <button onClick={() => setActiveTab("library")}
                    className="px-5 py-2 rounded-full text-sm font-bold nova-gradient text-white shadow-glow-blue">
                    Kutubxona
                  </button>
                  <button onClick={() => setActiveTab("library")}
                    className="px-5 py-2 rounded-full text-sm font-bold bg-slate-100 text-slate-600">
                    Lug''at
                  </button>
                </div>
                <LibraryPage />
              </div>
            )}
            {activeTab === "profile" && (
              <ProfilePage
                onPayment={() => setShowPayment(true)}
                onLeaderboard={() => {}}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}