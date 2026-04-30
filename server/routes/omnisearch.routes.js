const express = require('express');
const router = express.Router();
const omnisearchController = require('../controllers/omnisearch.controller');
const auth = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/omnisearch/extract - Extract search parameters from a user's resume
router.post('/extract', auth, asyncHandler(omnisearchController.extractParams));

// POST /api/omnisearch/search - Initiate background live search
router.post('/search', auth, asyncHandler(omnisearchController.startSearch));

// GET /api/omnisearch/status/:jobId - Poll for live search progress and results
router.get('/status/:jobId', auth, asyncHandler(omnisearchController.getSearchStatus));

module.exports = router;
