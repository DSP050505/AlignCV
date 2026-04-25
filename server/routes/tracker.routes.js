const express = require('express');
const router = express.Router();
const trackerController = require('../controllers/tracker.controller');

router.get('/', trackerController.getAll);
router.post('/', trackerController.create);
router.delete('/:id', trackerController.delete);

module.exports = router;
