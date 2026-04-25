// ─────────────────────────────────────────────────────────────────
// AlignCV — Global Error Middleware
// Catches all errors bubbled from routes/services and returns a
// consistent { success: false, error, code } response.
// ─────────────────────────────────────────────────────────────────

const logger = require('../utils/logger');
const config = require('../config');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Something went wrong';

  logger.error(`[Error] ${req.method} ${req.path} → ${status} ${code}: ${message}`, {
    stack: err.stack,
    userId: req.user?.id,
  });

  res.status(status).json({
    success: false,
    error: message,
    code,
    ...(config.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
