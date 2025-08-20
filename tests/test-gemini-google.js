/**
 * Gemini Connection Test using Official Google AI SDK
 * This should work better than LiteLLM for Gemini
 */

require('dotenv').config({ path: '../.env' });
// Note: @google/generative-ai has been removed from dependencies
// This test file is kept for reference but won't work without reinstalling the package

async function testGeminiGoogle() {
  console.log('🧪 Testing Gemini Connection with Official Google AI SDK...');
  console.log('Environment variables:');
  console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Found' : '❌ Not found');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('❌ No Gemini API key found. Please set GEMINI_API_KEY in your .env file');
    return;
  }

  try {
    // Initialize the Google AI SDK
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Get the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    console.log('📡 Attempting to connect to Gemini...');
    
    // Generate content
    const result = await model.generateContent('Hello! Please respond with "Connection successful!"');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ SUCCESS! Gemini connection working!');
    console.log('Response:', text);
    
    return { success: true, response: text };
    
  } catch (error) {
    console.log('❌ FAILED! Gemini connection error:');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    console.log('Full error:', error.toString());
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    
    return { success: false, error: error.message };
  }
}

// Run the test
testGeminiGoogle().catch(console.error);

