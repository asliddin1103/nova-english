import { env } from './env';

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:5173', // Student App dev
      'http://localhost:5174', // Admin Panel dev
      'https://t.me',
      process.env.STUDENT_APP_URL,
      process.env.ADMIN_PANEL_URL,
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (env.NODE_ENV === 'development') {
      // In dev, allow all origins for ease of testing
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
