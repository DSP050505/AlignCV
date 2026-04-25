const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const auth = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

router.post('/message', auth, asyncHandler(chatController.sendMessage));
router.post('/preview', auth, asyncHandler(chatController.previewMessage));
router.post('/apply', auth, asyncHandler(chatController.applyMessage));

module.exports = router;
