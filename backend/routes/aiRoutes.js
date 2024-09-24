const express = require('express');
const { getAIRecommendation } = require('../controllers/aiController');

const router = express.Router();

// POST route to get AI recommendations
router.post('/recommendation', getAIRecommendation);

module.exports = router;
