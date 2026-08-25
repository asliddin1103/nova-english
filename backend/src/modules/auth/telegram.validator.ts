import crypto from 'crypto';
import { env } from '../../config/env';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
}

export interface TelegramInitDataParsed {
  user: TelegramUser;
  auth_date: number;
  hash: string;
  query_id?: string;
  chat_instance?: string;
  chat_type?: string;
}

// Validates Telegram WebApp initData using HMAC-SHA256.
// See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export const validateTelegramInitData = (initDataRaw: string): TelegramInitDataParsed => {
  const params = new URLSearchParams(initDataRaw);
  const hash = params.get('hash');

  if (!hash) {
    throw new Error('Missing hash in initData');
  }

  // Build the data-check-string: all fields except hash, sorted alphabetically, joined by newline
  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Secret key = HMAC-SHA256("WebAppData", BOT_TOKEN)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(env.TELEGRAM_BOT_TOKEN)
    .digest();

  // Expected hash = HMAC-SHA256(secretKey, dataCheckString)
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (expectedHash !== hash) {
    throw new Error('Invalid initData hash — data may be tampered');
  }

  // Check auth_date is not too old (5 minutes window)
  const authDate = parseInt(params.get('auth_date') ?? '0', 10);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds - authDate > 300) {
    throw new Error('initData has expired (older than 5 minutes)');
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    throw new Error('Missing user in initData');
  }

  const user: TelegramUser = JSON.parse(userRaw);

  return {
    user,
    auth_date: authDate,
    hash,
    query_id: params.get('query_id') ?? undefined,
  };
};
