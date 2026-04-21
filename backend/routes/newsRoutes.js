const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

router.get('/', newsController.getNews);
router.get('/trending', newsController.getTrendingNews);
router.get('/category/:category', newsController.getNewsByCategory);
router.get('/:id', newsController.getNewsById);

module.exports = router;
