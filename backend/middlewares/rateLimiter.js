const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Global Rate Limiting: Limit total requests to 15 per minute globally
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 15, // Max 15 requests per minute across all users
  message: 'Rate limit exceeded. Please try again after a minute.',
});

// Slow down requests as the limit is approached (old behavior)
const globalSpeedLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minute window
  delayAfter: 10, // Allow 10 requests per minute at full speed
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 500; // Delay increases by 500ms for each additional request
  },
});

module.exports = [globalLimiter, globalSpeedLimiter];
