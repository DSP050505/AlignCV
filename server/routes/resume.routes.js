const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resume.controller');
const auth = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

router.post('/generate', auth, asyncHandler(resumeController.generateResume));
router.get('/', auth, asyncHandler(resumeController.getAllResumes));
router.get('/:id', auth, asyncHandler(resumeController.getResume));
router.put('/:id/source', auth, asyncHandler(resumeController.updateSource));
router.delete('/:id', auth, asyncHandler(resumeController.deleteResume));

module.exports = router;
