const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const router = express.Router();
const HF_API_KEY = process.env.HF_API_KEY;

const API_URL = "https://api-inference.huggingface.co/models/EleutherAI/gpt-neo-2.7B";

const headers = {
  Authorization: `Bearer ${HF_API_KEY}`,
};

router.post('/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Make request to Hugging Face API
    const response = await axios.post(API_URL, { inputs: prompt }, { headers });

    // Return AI response
    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error('Error with Hugging Face API:', error.response?.data || error.message);  // Log the exact error from Hugging Face API
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI response',
    });
  }
});

module.exports = router;
