// ─────────────────────────────────────────────────────────────────
// AlignCV — JWT Auth Middleware
// Verifies Bearer token and attaches req.user = { id, name }.
// ─────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthError } = require('../utils/errors');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new AuthError('No token provided');
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = { id: decoded.id, name: decoded.name };
    next();
  } catch (err) {
    throw new AuthError('Invalid or expired token');
  }
};
