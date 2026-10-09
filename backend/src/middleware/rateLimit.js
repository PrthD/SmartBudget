import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env.js';

const json429 = (message) => (_req, res) =>
  res.status(429).json({ error: { code: 'RATE_LIMITED', message } });

const skip = () => env.isTest;

/** Broad protection for the whole API. */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip,
  handler: json429('Too many requests. Please slow down.'),
});

/** Brute-force protection for credential endpoints, per IP + email. */
export const credentialsLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}:${String(req.body?.email ?? '').toLowerCase()}`,
  handler: json429('Too many attempts. Please try again in 15 minutes.'),
});

/** Bursts of AI calls burn the shared free-tier quota. */
export const aiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip,
  keyGenerator: (req) => req.userId,
  handler: json429('Please wait a moment before using AI features again.'),
});
