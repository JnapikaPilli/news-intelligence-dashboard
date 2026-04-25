const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// GET /api/news
router.get('/', newsController.getNews);

// GET /api/news/:id
router.get('/:id', newsController.getNewsById);

module.exports = router;
