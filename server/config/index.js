// ─────────────────────────────────────────────────────────────────
// AlignCV — Central Configuration
// All settings loaded from .env via dotenv. No hardcoded secrets.
// ─────────────────────────────────────────────────────────────────

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  // ── Server ────────────────────────────────────────────────────
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // ── Database ───────────────────────────────────────────────────
  DB: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || 'aligncv',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
    pool: { min: 2, max: 10 },
  },

  // ── Auth ───────────────────────────────────────────────────────
  JWT_SECRET: process.env.JWT_SECRET || 'aligncv-dev-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,

  // ── NVIDIA NIM ─────────────────────────────────────────────────
  NIM: {
    API_KEY: process.env.NIM_API_KEY || '',
    BASE_URL: process.env.NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    MODEL: process.env.NIM_MODEL || 'meta/llama-3.1-70b-instruct',
    TIMEOUT_MS: parseInt(process.env.NIM_TIMEOUT_MS, 10) || 60000,
    MAX_TOKENS: parseInt(process.env.NIM_MAX_TOKENS, 10) || 4096,
    TEMPERATURE: parseFloat(process.env.NIM_TEMPERATURE) || 0.2,
  },

  // ── File Upload ────────────────────────────────────────────────
  UPLOAD: {
    DIR: path.resolve(__dirname, '../uploads'),
    MAX_SIZE_MB: 5,
    ALLOWED_TYPES: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },

  // ── Export ─────────────────────────────────────────────────────
  EXPORT: {
    OUTPUT_DIR: path.resolve(__dirname, '../outputs'),
    TECTONIC_PATH: 'tectonic',
    PUPPETEER_TIMEOUT_MS: 30000,
  },

  // ── Rate Limits ────────────────────────────────────────────────
  RATE_LIMITS: {
    AI_ENDPOINTS: { windowMs: 60_000, max: 10 },
    AUTH_ENDPOINTS: { windowMs: 60_000, max: 20 },
    EXPORT_ENDPOINTS: { windowMs: 60_000, max: 5 },
    DEFAULT: { windowMs: 60_000, max: 100 },
  },

  // ── Frontend ───────────────────────────────────────────────────
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};
