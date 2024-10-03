import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Set the model to use
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Pre-defined dropdown questions
const predefinedQuestions = [
  'How should I allocate my budget?',
  'What savings goals should I set?',
  'How can I cut unnecessary expenses?',
];

// Controller function to handle AI recommendations
const getAIRecommendation = async (req, res) => {
  const { questionIndex, totalExpenses, totalIncome, savings } = req.body;

  // Validate the question index
  if (
    questionIndex === undefined ||
    questionIndex < 0 ||
    questionIndex >= predefinedQuestions.length
  ) {
    return res.status(400).json({ error: 'Invalid question selected.' });
  }

  // Retrieve the selected question from the predefined list
  const prompt = predefinedQuestions[questionIndex];

  // Construct a complete prompt with financial context
  const contextPrompt = `
    ${prompt}
    My total monthly expenses are $${totalExpenses}, and my total monthly income is $${totalIncome}. 
    I currently have $${savings} in savings. Based on this information, what would you recommend?
  `;

  try {
    // Generate content using the Gemini API with the contextual prompt
    const result = await model.generateContent(contextPrompt);

    // Send AI response back to the client
    res.status(200).json({
      success: true,
      data: result.response.text(), // AI-generated response
    });
  } catch (error) {
    console.error('Error with Gemini API:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI recommendation',
    });
  }
};

export default getAIRecommendation;
