// ─────────────────────────────────────────────────────────────────
// AlignCV — Express App Setup
// Middleware stack, route mounting, and error handler.
// ─────────────────────────────────────────────────────────────────

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const config = require('./config');

// ── Import Routes ────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const jdRoutes = require('./routes/jd.routes');
const resumeRoutes = require('./routes/resume.routes');
const skillgapRoutes = require('./routes/skillgap.routes');
const atsRoutes = require('./routes/ats.routes');
const chatRoutes = require('./routes/chat.routes');
const trackerRoutes = require('./routes/tracker.routes');
const referralRoutes = require('./routes/referral.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');

// ── Import Error Handler ─────────────────────────────────────────
const errorHandler = require('./middleware/error.middleware');

const app = express();

// ── Global Middleware ────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
  frameguard: false,  // Allow PDF iframe embedding from Vercel
}));
app.use(compression());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    const allowed = (config.CLIENT_URL || '').split(',').map(u => u.trim());
    if (allowed.includes(origin) || config.NODE_ENV === 'development') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static Serve (PDFs) ──────────────────────────────────────────
app.use('/outputs', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Type', 'application/pdf');
  next();
}, express.static(path.join(__dirname, 'outputs')));

// ── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ── Mount Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jd', jdRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/skillgap', skillgapRoutes);
app.use('/api/ats', atsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tracker', require('./middleware/auth.middleware'), trackerRoutes);
app.use('/api/referral', require('./middleware/auth.middleware'), referralRoutes);
app.use('/api/whatsapp', whatsappRoutes);
// app.use('/api/export', exportRoutes);

// ── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
  });
});

// ── Global Error Handler ─────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
