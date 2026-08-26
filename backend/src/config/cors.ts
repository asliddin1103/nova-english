/**
 * CORS Configuration
 *
 * Allowed origins are driven entirely by environment variables — no code
 * change is needed when adding new domains (Vercel, etc.).
 *
 * Railway / .env setup:
 *   ALLOWED_ORIGINS=https://nova-english-student.vercel.app,https://nova-english-admin.vercel.app
 *
 * The list is merged with the always-allowed localhost ports so that
 * local development keeps working without any extra config.
 */

const ALWAYS_ALLOWED = [
  'http://localhost:5173', // Student App dev
  'http://localhost:5174', // Admin Panel dev
];

function parseAllowedOrigins(): string[] {
  const fromEnv = process.env.ALLOWED_ORIGINS ?? '';
  const extra = fromEnv
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return [...ALWAYS_ALLOWED, ...extra];
}

export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    const allowedOrigins = parseAllowedOrigins();

    // Allow requests with no origin (Postman, server-to-server, React Native)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production') {
      // In development allow all origins for easy testing
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin "${origin}" is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
