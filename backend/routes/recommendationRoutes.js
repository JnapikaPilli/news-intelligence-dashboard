const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

// GET /api/recommendations/articles/:topic
router.get('/articles/:topic', recommendationController.getArticleRecommendations);

// GET /api/recommendations/videos/:topic
router.get('/videos/:topic', recommendationController.getVideoRecommendations);

module.exports = router;
