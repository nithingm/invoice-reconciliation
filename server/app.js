// Add this near the top after require('dotenv').config()
require('dotenv').config();

// Set Google API key for LiteLLM if Gemini key exists
if (process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
  console.log('✅ Google API key configured for LiteLLM');
}