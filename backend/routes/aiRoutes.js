import express from 'express';
import getAIRecommendation from '../controllers/aiController.js';
import logger from '../config/logger.js';

const router = express.Router();

// @route    POST /api/ai/recommendation
// @desc     Get AI-based budget recommendations
router.post('/recommendation', async (req, res) => {
  logger.info('POST /api/ai/recommendation request received');
  try {
    await getAIRecommendation(req, res);
  } catch (err) {
    logger.error('Error in AI recommendation: ' + err.message);
    res
      .status(500)
      .json({ error: 'Internal server error. Please try again later.' });
  }
});

export default router;
