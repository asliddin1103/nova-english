import { Bot } from 'node-telegram-bot-api';
import { env } from '../../config/env';

// Singleton bot instance
let bot: Bot | null = null;

export const initBot = (): Bot | null => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not provided, bot is disabled');
    return null;
  }

  if (bot) return bot;

  try {
    bot = new Bot(env.TELEGRAM_BOT_TOKEN);

    const webAppUrl = process.env.MINI_APP_URL || 'https://nova-english-app.vercel.app';

    // Handle /start command
    bot.command('start', async (ctx) => {
      const firstName = ctx.from?.first_name || "Do'st";

      const welcomeText =
        `👋 *Assalomu alaykum, ${firstName}!*\n\n` +
        `🌟 *Nova English* o'quv platformasiga xush kelibsiz!\n\n` +
        `Bu yerda siz:\n` +
        `📚 Video darslar va topshiriqlarni bajarishingiz\n` +
        `📝 Testlar yechib, bilimlaringizni sinashingiz\n` +
        `🪙 NovaCoin ishlab, liderlar qatoriga kirishingiz\n` +
        `🎙️ Speaking & Writing topshiriqlariga ustozlardan feedback olishingiz mumkin!\n\n` +
        `Darslarni boshlash uchun quyidagi tugmani bosing 👇`;

      await ctx.reply(welcomeText, {
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
    bot.on('callback_query', async (ctx) => {
      const query = ctx.callbackQuery;
      if (!query?.data) return;

      if (query.data === 'payment_info') {
        const paymentText =
          `💳 *Nova English To'lov ma'lumotlari:*\n\n` +
          `🔹 *Karta raqami:* \`${env.PAYMENT_CARD_NUMBER || '8600 1234 5678 9012'}\`\n` +
          `🔹 *Karta egasi:* ${env.PAYMENT_CARD_HOLDER || 'Nova English'}\n` +
          `🔹 *Oylik to'lov:* 150 000 so'm / oy\n\n` +
          `To'lov qilgach, chek rasmini Mini App orqali yuboring. Adminlar tezda tasdiqlashadi!`;

        await ctx.reply(paymentText, { parse_mode: 'Markdown' });
      }

      await ctx.answerCallbackQuery();
    });

    // Start polling
    bot.startPolling().catch((err) => {
      console.error('⚠️ Telegram Bot Polling Error:', err);
    });

    console.log('🤖 Telegram Bot (@nova_english_bot) started and polling for messages...');
    return bot;
  } catch (err) {
    console.error('❌ Failed to initialize Telegram Bot:', err);
    return null;
  }
};

export const getBot = (): Bot | null => {
  if (!bot) {
    return initBot();
  }
  return bot;
};
