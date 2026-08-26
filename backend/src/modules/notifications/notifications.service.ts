import { getBot } from './bot';

export const notifyPaymentApproved = async (telegramId: string, expiresAt: Date): Promise<void> => {
  try {
    const bot = getBot();
    if (!bot) return;
    const expiry = expiresAt.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' });
    await bot.api.sendMessage({
      chat_id: telegramId,
      text: `✅ *To'lovingiz tasdiqlandi!*\n\nObunangiz faollashtirildi.\n📅 Muddati: ${expiry}\n\nO'qishni davom ettiring! 🚀`,
      parse_mode: 'Markdown',
    });
  } catch (err) {
    console.error('Failed to send payment approval notification:', err);
  }
};

export const notifyPaymentRejected = async (telegramId: string, reason: string): Promise<void> => {
  try {
    const bot = getBot();
    if (!bot) return;
    await bot.api.sendMessage({
      chat_id: telegramId,
      text: `❌ *To'lovingiz rad etildi.*\n\n📝 Sabab: ${reason}\n\nIltimos, chekni qayta yuklang yoki admin bilan bog'laning.`,
      parse_mode: 'Markdown',
    });
  } catch (err) {
    console.error('Failed to send payment rejection notification:', err);
  }
};

export const notifySubmissionReviewed = async (
  telegramId: string,
  testTitle: string,
  feedback: string,
  score?: string
): Promise<void> => {
  try {
    const bot = getBot();
    if (!bot) return;
    const scoreText = score ? `\n⭐ Baho: *${score}*` : '';
    await bot.api.sendMessage({
      chat_id: telegramId,
      text: `📝 *${testTitle}* javobingizga feedback keldi!${scoreText}\n\n💬 ${feedback}`,
      parse_mode: 'Markdown',
    });
  } catch (err) {
    console.error('Failed to send submission review notification:', err);
  }
};
