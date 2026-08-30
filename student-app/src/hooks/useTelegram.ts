import { useEffect, useState } from "react";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export const useTelegram = () => {
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20; // ~2 soniya (20 x 100ms)

    const checkTelegram = () => {
      const tg = (window as any).Telegram?.WebApp;

      if (tg && tg.initData && tg.initData.length > 0) {
        try {
          tg.ready();
          tg.expand();
        } catch {
          // ignore
        }
        setInitData(tg.initData);
        setTgUser(tg.initDataUnsafe?.user ?? null);
        setIsReady(true);
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkTelegram, 100);
      } else {
        // Haqiqiy Telegram muhitida emasligi aniqlandi
        if (import.meta.env.DEV) {
          // FAQAT lokal development uchun mock ruxsat etiladi
          if (tg) {
            try {
              tg.ready();
              tg.expand();
            } catch {}
          }
          const mockUser: TelegramUser = {
            id: 123456789,
            first_name: "Student",
            last_name: "Test",
            username: "novastudent",
          };
          setTgUser(mockUser);
          setInitData("mock_init_data");
          setIsReady(true);
        } else {
          // PRODUCTION: mock YO'Q, aniq bo'sh holat
          setIsReady(true);
          setTgUser(null);
          setInitData("");
        }
      }
    };

    checkTelegram();
  }, []);

  return { tgUser, initData, isReady };
};