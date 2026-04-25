const express = require('express');
const router = express.Router();
const jdController = require('../controllers/jd.controller');
const auth = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

router.post('/analyse', auth, asyncHandler(jdController.analyseJD));
router.get('/', auth, asyncHandler(jdController.getAllJDs));
router.get('/:id', auth, asyncHandler(jdController.getJD));

module.exports = router;
