import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const predefinedQuestions = [
  'How should I allocate my budget?',
  'What savings goals should I set?',
  'How can I cut unnecessary expenses?',
];

const getAIRecommendation = async (req, res) => {
  const { questionIndex, totalExpenses, totalIncome, savings } = req.body;

  if (
    questionIndex === undefined ||
    questionIndex < 0 ||
    questionIndex >= predefinedQuestions.length
  ) {
    return res.status(400).json({ error: 'Invalid question selected.' });
  }

  if (isNaN(totalExpenses) || isNaN(totalIncome) || isNaN(savings)) {
    return res
      .status(400)
      .json({ error: 'Invalid financial values provided.' });
  }

  const prompt = predefinedQuestions[questionIndex];
  const contextPrompt = `
    ${prompt}
    My total monthly expenses are $${totalExpenses}, and my total monthly income is $${totalIncome}. 
    I currently have $${savings} in savings. Based on this information, what would you recommend?
  `;

  try {
    const result = await model.generateContent(contextPrompt);
    res.status(200).json({
      success: true,
      data: result.response.text(),
    });
  } catch (error) {
    console.error('Error with Gemini API:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI recommendation. Please try again later.',
    });
  }
};

export default getAIRecommendation;
