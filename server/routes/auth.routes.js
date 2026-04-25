// ─────────────────────────────────────────────────────────────────
// AlignCV — Auth Routes
// POST /api/auth/signup, /login, GET /me, POST /logout
// ─────────────────────────────────────────────────────────────────

const { Router } = require('express');
const { z } = require('zod');
const authController = require('../controllers/auth.controller');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const router = Router();

// ── Zod Schemas ──────────────────────────────────────────────────
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  passcode: z.string().min(4, 'Passcode must be at least 4 characters').max(100),
});

const loginSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  passcode: z.string().min(1, 'Passcode is required'),
});

// ── Routes ───────────────────────────────────────────────────────
router.post('/signup', authLimiter, validate(signupSchema), asyncHandler(authController.signup));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.get('/me', auth, asyncHandler(authController.getMe));
router.post('/logout', auth, asyncHandler(authController.logout));

module.exports = router;
