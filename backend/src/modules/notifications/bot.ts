import { Bot } from 'node-telegram-bot-api';
import { env } from '../../config/env';
import { prisma } from '../../database/prisma';

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

    // Handle my_chat_member (bot blocked, deleted or unblocked)
    bot.on('my_chat_member', async (ctx: any) => {
      try {
        const update = ctx.myChatMember || ctx.my_chat_member || ctx;
        const newStatus = update?.new_chat_member?.status || update?.newChatMember?.status;
        const telegramId = String(
          update?.from?.id ||
          update?.chat?.id ||
          ctx?.from?.id ||
          ctx?.chat?.id
        );

        if (!telegramId || telegramId === 'undefined') return;

        if (newStatus === 'kicked') {
          // Foydalanuvchi botni bloklagan yoki o'chirgan
          console.log(`🚫 Foydalanuvchi (ID: ${telegramId}) botni blokladi/o'chirdi (status: kicked).`);
          await prisma.user.updateMany({
            where: { telegramId },
            data: {
              onboardingCompleted: false,
              botStatus: 'kicked',
            },
          });
        } else if (newStatus === 'member') {
          // Foydalanuvchi botni qayta ochgan/faollashtirgan
          console.log(`✅ Foydalanuvchi (ID: ${telegramId}) botni qayta faollashtirdi (status: member).`);
          await prisma.user.updateMany({
            where: { telegramId },
            data: {
              botStatus: 'member',
            },
          });
        }
      } catch (err) {
        console.error('⚠️ Error in my_chat_member handler:', err);
      }
    });

    // Handle /start command
    bot.command('start', async (ctx) => {
      const telegramId = ctx.from?.id ? String(ctx.from.id) : null;
      const firstName = ctx.from?.first_name || "Do'st";
      const lastName = ctx.from?.last_name || null;
      const username = ctx.from?.username || null;

      if (telegramId) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { telegramId },
          });

          if (!existingUser) {
            // 1. Yangi foydalanuvchi — onboardingCompleted = false, botStatus = member
            await prisma.user.create({
              data: {
                telegramId,
                firstName,
                lastName,
                username,
                onboardingCompleted: false,
                botStatus: 'member',
                streak: { create: {} },
                coins: { create: { total: 0 } },
              },
            });
          } else {
            // 2. Mavjud foydalanuvchi — botStatus qayta 'member' qilinadi
            await prisma.user.update({
              where: { telegramId },
              data: {
                firstName,
                lastName,
                username,
                botStatus: 'member',
              },
            });
          }
        } catch (dbErr) {
          console.error('Error tracking user on /start:', dbErr);
        }
      }

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
