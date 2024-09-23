const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const API_URL = "http://localhost:5000/api/ai/generate";  // Make sure this is correct
const prompt = "Give me a budget recommendation for someone who earns $3000 monthly.";

async function testAPI() {
  try {
    const response = await axios.post(API_URL, { prompt });
    console.log('Response from server:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error status:', error.response.status);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAPI();
