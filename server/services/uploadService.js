// ─────────────────────────────────────────────────────────────────
// AlignCV — Upload Service
// Handles fetching text from PDFs using pdf-parse and multer configs.
// ─────────────────────────────────────────────────────────────────

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const config = require('../config');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// Ensure upload directory exists
if (!fs.existsSync(config.UPLOAD.DIR)) {
  fs.mkdirSync(config.UPLOAD.DIR, { recursive: true });
}

// Memory storage for fastest streaming to NIM, no local file clutter
const storage = multer.memoryStorage();

// File filter (PDF only for now)
const fileFilter = (req, file, cb) => {
  if (config.UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF files are supported.', 400), false);
  }
};

// Multer upload middleware
const uploadMiddleWare = multer({
  storage,
  limits: { fileSize: config.UPLOAD.MAX_SIZE_MB * 1024 * 1024 },
  fileFilter,
});

/**
 * Extracts raw text from an uploaded file buffer.
 */
async function extractTextFromBuffer(buffer, mimetype) {
  try {
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    }
    throw new AppError('Unsupported file type for extraction', 400);
  } catch (error) {
    logger.error(`[Upload] Text extraction failed: ${error.message}`);
    throw new AppError('Failed to read file content (might be corrupted or locked).', 422);
  }
}

module.exports = {
  uploadMiddleWare,
  extractTextFromBuffer,
};
