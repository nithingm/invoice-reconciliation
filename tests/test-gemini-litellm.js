/**
 * Gemini Connection Test using Updated LiteLLM Configuration
 * This tests the corrected LiteLLM setup for Gemini models
 */

require('dotenv').config({ path: '../.env' });
const litellm = require('litellm');

async function testGeminiLiteLLM() {
  console.log('🧪 Testing Gemini Connection with Updated LiteLLM...');
  console.log('Environment variables:');
  console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Found' : '❌ Not found');
  console.log('- GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '✅ Found' : '❌ Not found');
  console.log('- GOOGLE_GENERATIVE_AI_API_KEY:', process.env.GOOGLE_GENERATIVE_AI_API_KEY ? '✅ Found' : '❌ Not found');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('❌ No Gemini API key found. Please set GEMINI_API_KEY in your .env file');
    return;
  }

  // Set the API keys for LiteLLM
  process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
  console.log('✅ API keys configured for LiteLLM');

  // Test different model name formats
  const modelNames = [
    'google/gemini-2.5-flash-lite',
    'google/gemini-2.0-flash',
    'google/gemini-2.0-flash-lite'
  ];

  for (const modelName of modelNames) {
    try {
      console.log(`\n📡 Testing model: ${modelName}`);
      
      const response = await litellm.completion({
        model: modelName,
        messages: [{ role: 'user', content: 'Hello! Please respond with "Connection successful!"' }],
        stream: false,
        max_tokens: 50
      });

      console.log('✅ SUCCESS! Gemini connection working!');
      console.log('Model:', modelName);
      console.log('Response:', response.choices[0].message.content);
      return; // Exit on first success
      
    } catch (error) {
      console.log(`❌ Failed with ${modelName}:`, error.message);
    }
  }

  console.log('\n❌ All model names failed. Here are some troubleshooting steps:');
  console.log('1. Check if your Gemini API key is valid');
  console.log('2. Verify you have access to Gemini models');
  console.log('3. Check LiteLLM documentation for supported model names');
  console.log('4. Try updating LiteLLM: npm install litellm@latest');
}

// Run the test
testGeminiLiteLLM().catch(console.error);

