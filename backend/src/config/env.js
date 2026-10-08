import 'dotenv/config';
import { z } from 'zod';

const csv = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  // Comma-separated list, plus the legacy single-origin variables below.
  CORS_ORIGINS: csv,
  FRONTEND_DEV_ORIGIN: z.string().optional(),
  FRONTEND_PROD_ORIGIN: z.string().optional(),
  FRONTEND_CUSTOM_ORIGIN: z.string().optional(),
  // Number of reverse proxies in front of the app (Render = 1).
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  // Defaults to "none" in production (the web app and API live on different
  // sites, e.g. two *.onrender.com hosts) and "lax" elsewhere.
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).optional(),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .optional(),
  GEMINI_API_KEY: z.string().optional(),
  // Ordered fallback chain; the first model that answers wins.
  GEMINI_MODELS: csv,
  AI_DAILY_REQUESTS_PER_USER: z.coerce.number().int().positive().default(30),
});

function loadEnv() {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const env = parsed.data;
  const isProduction = env.NODE_ENV === 'production';
  const cookieSecure = env.COOKIE_SECURE ?? isProduction;
  const cookieSameSite = env.COOKIE_SAMESITE ?? (isProduction ? 'none' : 'lax');
  // Browsers drop SameSite=None cookies that aren't Secure: fail loudly.
  if (cookieSameSite === 'none' && !cookieSecure) {
    throw new Error(
      'Invalid environment configuration:\n  - COOKIE_SAMESITE=none requires Secure cookies (COOKIE_SECURE=true).'
    );
  }

  return {
    ...env,
    isProduction,
    isTest: env.NODE_ENV === 'test',
    corsOrigins: [
      ...env.CORS_ORIGINS,
      env.FRONTEND_DEV_ORIGIN,
      env.FRONTEND_PROD_ORIGIN,
      env.FRONTEND_CUSTOM_ORIGIN,
    ].filter(Boolean),
    cookieSecure,
    cookieSameSite,
    logLevel: env.LOG_LEVEL ?? (env.NODE_ENV === 'test' ? 'silent' : 'info'),
    geminiModels: env.GEMINI_MODELS.length
      ? env.GEMINI_MODELS
      : ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'],
  };
}

export const env = loadEnv();
