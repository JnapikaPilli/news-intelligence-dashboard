const express = require('express');
const router = express.Router();
const ragController = require('../controllers/ragController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), ragController.uploadFile);
router.post('/query', ragController.queryContent);
router.post('/summarize-section', ragController.summarizeSection);
router.post('/tts', ragController.generateTTS);

module.exports = router;
