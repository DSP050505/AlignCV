// ─────────────────────────────────────────────────────────────────
// AlignCV — Auth Controller
// Thin controller layer — delegates to authService.
// All handlers wrapped in asyncHandler (no try/catch here).
// ─────────────────────────────────────────────────────────────────

const authService = require('../services/authService');

// POST /api/auth/signup
exports.signup = async (req, res) => {
  const { name, passcode } = req.body;
  const result = await authService.signup(name, passcode);
  res.status(201).json({ success: true, data: result });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { name, passcode } = req.body;
  const result = await authService.login(name, passcode);
  res.json({ success: true, data: result });
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json({ success: true, data: user });
};

// POST /api/auth/logout (client-side token clear)
exports.logout = async (req, res) => {
  res.json({ success: true, data: { message: 'Logged out' } });
};
