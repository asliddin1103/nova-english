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
    setLoading(true);
    try {
      const res = await api.get("/onboarding/status");
      const data = res.data.data as OnboardingStatus;
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
      return true;
    } catch {
      return false;
    }
  }, []);

  return { status, loading, checkStatus, savePartial, complete };
};
