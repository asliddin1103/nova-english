import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  ADMIN_JWT_SECRET: z.string().min(32, 'ADMIN_JWT_SECRET must be at least 32 chars'),
  ADMIN_JWT_EXPIRES_IN: z.string().default('8h'),

  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),

  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.string().default('10').transform(Number),

  PAYMENT_CARD_NUMBER: z.string().default('0000 0000 0000 0000'),
  PAYMENT_CARD_HOLDER: z.string().default('Nova English'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
