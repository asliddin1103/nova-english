import { useEffect, useState } from "react";
import { useStore } from "../../store/useStore";
import { useTelegram } from "../../hooks/useTelegram";
import api from "../../services/api";

export const useTelegramAuth = () => {
  const { setAuth, token } = useStore();
  const { initData, isReady } = useTelegram();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;

    const authenticate = async () => {
      // 1. Agar avvaldan token mavjud bo'lsa, /me orqali tekshirish
      if (token) {
        try {
          const res = await api.get("/me");
          useStore.getState().updateUser(res.data.data);
          setLoading(false);
          return;
        } catch {
          // Token eskirgan bo'lsa — qaytadan auth qilinadi
        }
      }

      // 2. Agar initData bo'sh bo'lsa (Telegramdan tashqarida ochilgan)
      if (!initData) {
        if (import.meta.env.DEV) {
          try {
            const devRes = await api.post("/auth/dev-login", {});
            const { token: devToken, user: devUser } = devRes.data.data;
            setAuth(devUser, devToken);
          } catch {
            setError("Dev login xatosi");
          }
        } else {
          setError("Iltimos, Nova English ilovasini Telegram orqali oching (@nova_english_bot).");
        }
        setLoading(false);
        return;
      }

      // 3. Haqiqiy Telegram initData orqali autentifikatsiya
      try {
        const res = await api.post("/auth/telegram", { initData });
        const { token: newToken, user } = res.data.data;
        setAuth(user, newToken);
      } catch (err: any) {
        if (import.meta.env.DEV) {
          try {
            const devRes = await api.post("/auth/dev-login", {});
            const { token: devToken, user: devUser } = devRes.data.data;
            setAuth(devUser, devToken);
          } catch {
            setError(err.response?.data?.error?.message ?? "Autentifikatsiya xatosi");
          }
        } else {
          setError(err.response?.data?.error?.message ?? "Telegram autentifikatsiya xatosi. Iltimos, qayta kiring.");
        }
      } finally {
        setLoading(false);
      }
    };

    authenticate();
  }, [isReady, initData]);

  return { loading, error };
};