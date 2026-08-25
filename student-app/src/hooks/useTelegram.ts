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
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initData && tg.initData.length > 0) {
      tg.ready();
      tg.expand();
      setInitData(tg.initData);
      setTgUser(tg.initDataUnsafe?.user ?? null);
      setIsReady(true);
    } else {
      // Desktop browser dev mode fallback
      if (tg) {
        tg.ready();
        tg.expand();
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
    }
  }, []);

  return { tgUser, initData, isReady };
};