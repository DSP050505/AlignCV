const express = require('express');
const multer = require('multer');
const router = express.Router();
const referralController = require('../controllers/referral.controller');

// Multer: store CSV in memory buffer, max 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
});

router.post('/fetch-job', referralController.fetchJob);
router.post('/match-connections', upload.single('csv'), referralController.matchConnections);
router.post('/find-public-employees', referralController.findPublicEmployees);
router.post('/send-messages', referralController.sendMessages);
router.get('/log', referralController.getLog);
router.put('/outreach/:id', referralController.updateOutreach);

module.exports = router;
