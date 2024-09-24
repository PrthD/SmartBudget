const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Set the model to use
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Pre-defined dropdown questions
const predefinedQuestions = [
  "How should I allocate my budget?",
  "What savings goals should I set?",
  "How can I cut unnecessary expenses?"
];

// Controller function to handle AI recommendations
const getAIRecommendation = async (req, res) => {
  const { questionIndex } = req.body;

  if (questionIndex === undefined || questionIndex < 0 || questionIndex >= predefinedQuestions.length) {
    return res.status(400).json({ error: 'Invalid question selected.' });
  }

  const prompt = predefinedQuestions[questionIndex];  // Dropdown selected question

  try {
    // Generate content using the Gemini API
    const result = await model.generateContent(prompt);

    // Send AI response back to the client
    res.status(200).json({
      success: true,
      data: result.response.text(),  // AI-generated response
    });
  } catch (error) {
    console.error('Error with Gemini API:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI recommendation',
    });
  }
};

module.exports = { getAIRecommendation };
