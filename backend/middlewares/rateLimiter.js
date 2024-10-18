import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import logger from './logger.js';

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Rate limit exceeded. Please try again after a minute.',
  onLimitReached: (req) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
  },
});

const globalSpeedLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 10,
  delayMs: (used, req) => (used - req.slowDown.limit) * 500,
});

export { globalLimiter, globalSpeedLimiter };
