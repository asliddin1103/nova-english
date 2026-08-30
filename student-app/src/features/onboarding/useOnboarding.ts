import { useState, useCallback } from "react";
import api from "../../services/api";

export interface OnboardingData {
  ageGroup: string;
  gender: string;
  goals: string[];
  currentLevel: string;
  skills: string[];
  dailyTime: string;
}

interface OnboardingStatus {
  hasOnboarding: boolean;
  isCompleted: boolean;
  partial: Partial<OnboardingData> | null;
}

export const useOnboarding = () => {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async (): Promise<OnboardingStatus> => {
    // Agar local storage'da allaqachon yakunlangan bo'lsa
    if (localStorage.getItem("nova_onboarding_completed") === "true") {
      const completed = { hasOnboarding: true, isCompleted: true, partial: null };
      setStatus(completed);
      return completed;
    }

    setLoading(true);
    try {
      const res = await api.get("/onboarding/status");
      const data = res.data.data as OnboardingStatus;
      if (data.isCompleted) {
        localStorage.setItem("nova_onboarding_completed", "true");
      }
      setStatus(data);
      return data;
    } catch {
      const fallback = { hasOnboarding: false, isCompleted: false, partial: null };
      setStatus(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, []);

  const savePartial = useCallback(async (data: Partial<OnboardingData>) => {
    try {
      await api.post("/onboarding/save", data);
    } catch {
      // Qisman saqlashda xatolik — foydalanuvchini bloklamaymiz
    }
  }, []);

  const complete = useCallback(async (data: OnboardingData): Promise<boolean> => {
    try {
      await api.post("/onboarding/complete", data);
      localStorage.setItem("nova_onboarding_completed", "true");
      return true;
    } catch (err) {
      console.warn("Onboarding complete sync error, proceeding locally:", err);
      localStorage.setItem("nova_onboarding_completed", "true");
      return true; // Foydalanuvchini hech qachon ekranda bloklab qo'ymaymiz
    }
  }, []);

  const skip = useCallback(async () => {
    localStorage.setItem("nova_onboarding_completed", "true");
    try {
      await api.post("/onboarding/skip");
    } catch {
      // Offline yoki vaqtincha xatolik bo'lsa ham local saqlangan
    }
  }, []);

  return { status, loading, checkStatus, savePartial, complete, skip };
};
