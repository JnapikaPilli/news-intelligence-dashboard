const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');

router.get('/preferences', languageController.getPreferences);
router.put('/preferences', languageController.updatePreferences);

module.exports = router;
