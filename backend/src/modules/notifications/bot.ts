import * as TelegramBotLib from 'node-telegram-bot-api';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TelegramBot = (TelegramBotLib as any).default ?? TelegramBotLib;
import { env } from '../../config/env';

// Singleton bot instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let bot: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const initBot = (): any | null => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not provided, bot is disabled');
    return null;
  }

  if (bot) return bot;

  try {
    bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });

    const webAppUrl = process.env.MINI_APP_URL || 'https://nova-english-app.vercel.app';

    // Handle /start command
    bot.onText(/\/start/, async (msg: any) => {
      const chatId = msg.chat.id;
      const firstName = msg.from?.first_name || "Do'st";

      const welcomeText =
        `👋 *Assalomu alaykum, ${firstName}!*\n\n` +
        `🌟 *Nova English* o'quv platformasiga xush kelibsiz!\n\n` +
        `Bu yerda siz:\n` +
        `📚 Video darslar va topshiriqlarni bajarishingiz\n` +
        `📝 Testlar yechib, bilimlaringizni sinashingiz\n` +
        `🪙 NovaCoin ishlab, liderlar qatoriga kirishingiz\n` +
        `🎙️ Speaking & Writing topshiriqlariga ustozlardan feedback olishingiz mumkin!\n\n` +
        `Darslarni boshlash uchun quyidagi tugmani bosing 👇`;

      await bot!.sendMessage(chatId, welcomeText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Darslarni boshlash (Mini App)',
                web_app: { url: webAppUrl },
              },
            ],
            [
              {
                text: "💳 Obuna va To'lov",
                callback_data: 'payment_info',
              },
              {
                text: "📞 Qo'llab-quvvatlash",
                url: 'https://t.me/nova_support',
              },
            ],
          ],
        },
      });
    });

    // Handle callback queries
    bot.on('callback_query', async (query: any) => {
      if (!query.data || !query.message) return;

      if (query.data === 'payment_info') {
        const paymentText =
          `💳 *Nova English To'lov ma'lumotlari:*\n\n` +
          `🔹 *Karta raqami:* \`${env.PAYMENT_CARD_NUMBER || '8600 1234 5678 9012'}\`\n` +
          `🔹 *Karta egasi:* ${env.PAYMENT_CARD_HOLDER || 'Nova English'}\n` +
          `🔹 *Oylik to'lov:* 150 000 so'm / oy\n\n` +
          `To'lov qilgach, chek rasmini Mini App orqali yuboring. Adminlar tezda tasdiqlashadi!`;

        await bot!.sendMessage(query.message.chat.id, paymentText, { parse_mode: 'Markdown' });
      }

      await bot!.answerCallbackQuery(query.id);
    });

    // Catch errors
    bot.on('polling_error', (err: any) => {
      console.error('⚠️ Telegram Bot Polling Error:', err);
    });

    console.log('🤖 Telegram Bot (@nova_english_bot) started and polling for messages...');
    return bot;
  } catch (err) {
    console.error('❌ Failed to initialize Telegram Bot:', err);
    return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getBot = (): any => {
  if (!bot) {
    const initialized = initBot();
    if (initialized) return initialized;
    return new TelegramBot(env.TELEGRAM_BOT_TOKEN || 'dummy');
  }
  return bot;
};
