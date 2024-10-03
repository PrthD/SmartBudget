import express from 'express';
import getAIRecommendation from '../controllers/aiController.js';

const router = express.Router();

// POST route to get AI recommendations
router.post('/recommendation', getAIRecommendation);

export default router;
