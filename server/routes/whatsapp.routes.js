const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');
const requireAuth = require('../middleware/auth.middleware');

// Authenticated endpoint to generate WhatsApp linking code
router.post('/generate-code', requireAuth, whatsappController.generateAccessCode);

module.exports = router;
