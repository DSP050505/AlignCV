const express = require('express');
const router = express.Router();
const atsController = require('../controllers/ats.controller');
const auth = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/score', auth, asyncHandler(atsController.scoreResume));
router.post('/quick-check', auth, upload.single('resume'), asyncHandler(atsController.checkQuickScore));

module.exports = router;
