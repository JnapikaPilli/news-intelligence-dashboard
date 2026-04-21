const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

router.get('/articles/:topic', recommendationController.getRelatedArticles);
router.get('/videos/:topic', recommendationController.getRelatedVideos);

module.exports = router;
