// ─────────────────────────────────────────────────────────────────
// AlignCV — Rate Limit Middleware
// Factory functions for different endpoint groups.
// ─────────────────────────────────────────────────────────────────

const rateLimit = require('express-rate-limit');
const config = require('../config');

const createLimiter = (opts) =>
  rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
    },
  });

module.exports = {
  aiLimiter: createLimiter(config.RATE_LIMITS.AI_ENDPOINTS),
  authLimiter: createLimiter(config.RATE_LIMITS.AUTH_ENDPOINTS),
  exportLimiter: createLimiter(config.RATE_LIMITS.EXPORT_ENDPOINTS),
  defaultLimiter: createLimiter(config.RATE_LIMITS.DEFAULT),
};
