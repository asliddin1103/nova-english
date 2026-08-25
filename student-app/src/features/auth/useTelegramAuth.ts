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
      // If already have a valid token, try to refresh user data
      if (token) {
        try {
          const res = await api.get("/me");
          useStore.getState().updateUser(res.data.data);
          setLoading(false);
          return;
        } catch {
          // Token expired — fall through to re-auth
        }
      }

      try {
        const res = await api.post("/auth/telegram", { initData });
        const { token: newToken, user } = res.data.data;
        setAuth(user, newToken);
      } catch (err: any) {
        // In local development, fallback to dev-login if Telegram validation fails
        try {
          const devRes = await api.post("/auth/dev-login", {});
          const { token: devToken, user: devUser } = devRes.data.data;
          setAuth(devUser, devToken);
        } catch {
          setError(err.response?.data?.error?.message ?? "Autentifikatsiya xatosi");
        }
      } finally {
        setLoading(false);
      }
    };

    authenticate();
  }, [isReady]);

  return { loading, error };
};