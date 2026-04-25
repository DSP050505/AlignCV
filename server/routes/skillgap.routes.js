const express = require('express');
const router = express.Router();
const skillgapController = require('../controllers/skillgap.controller');
const auth = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

router.post('/analyse', auth, asyncHandler(skillgapController.analyseGaps));
router.post('/accept', auth, asyncHandler(skillgapController.acceptSkill));
router.post('/preview-accept', auth, asyncHandler(skillgapController.previewAccept));
router.post('/apply-accept', auth, asyncHandler(skillgapController.applyAccept));

module.exports = router;
