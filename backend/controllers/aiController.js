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

  const netIncome = totalIncome - totalExpenses;

  // const prompt = predefinedQuestions[questionIndex];
  const prompt = `
    ${prompt}
    The user has provided the following financial details:
    - Total monthly income: $${totalIncome}
    - Total monthly expenses: $${totalExpenses}
    - Current savings: $${savings}
    - Net income (income minus expenses): $${netIncome}

    Based on this information, please recommend a personalized budget plan by:
    1. Allocating income into three categories:
       - **Essentials (50-60% of net income)**
       - **Savings (20-30% of net income)**
       - **Non-essentials (10-20% of net income)**

    2. Offering tips for optimizing savings and reducing unnecessary expenses.

    Provide the budget in a clear, actionable format, using dollar amounts for each category. Break down expenses into detailed suggestions, and prioritize savings strategies.
  `;

  try {
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    const formattedResponse = aiResponse
      .replace(/\*\*/g, '')
      .replace(/1\./g, '\n\n1. **Budget Breakdown:**')
      .replace(/2\./g, '\n\n2. **Savings Optimization Tips:**')
      .replace(/Track Your Spending/g, '**Track Your Spending**')
      .replace(/Review Regularly/g, '**Review Regularly**')
      .replace(/Essentials:/g, '**Essentials:**')
      .replace(/Savings:/g, '**Savings:**')
      .replace(/Non-essentials:/g, '**Non-essentials:**');

    res.status(200).json({
      success: true,
      data: formattedResponse,
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
