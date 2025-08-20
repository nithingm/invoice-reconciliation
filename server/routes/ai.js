const express = require('express');
const axios = require('axios');
const router = express.Router();
const { getOllamaModels, testGeminiConnection } = require('../services/aiService');

router.get('/models', async (req, res) => {
  const ollamaModels = await getOllamaModels();

  const availableModels = {
    ollama: ollamaModels,
    gemini: ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'],
    openai: ['gpt-5-nano', 'gpt-5-mini'],
    anthropic: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-latest'],
  };
  res.json(availableModels);
});

router.post('/config', (req, res) => {
  const { model } = req.body;
  if (!model) {
    return res.status(400).json({ error: 'Model is required' });
  }

  // Store the AI configuration in app.locals to be accessible across the application
  req.app.locals.aiConfig = { model };
  console.log(`AI model set to ${model}`);
  res.json({ success: true, message: `AI model set to ${model}` });
});

router.post('/test-gemini', async (req, res) => {
  try {
    const result = await testGeminiConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Test failed', 
      details: error.message 
    });
  }
});

router.post('/test-python-gemini', async (req, res) => {
  try {
    const { model = 'gemini-2.5-flash-lite' } = req.body;
    
    // Test the Python microservice
    const response = await axios.post('http://localhost:5001/ai/process', {
      message: 'Hello! Please respond with a simple JSON: {"intent": "general", "message": "test"}',
      model: model,
      context: null
    });
    
    if (response.data.success) {
      res.json({
        success: true,
        message: 'Python Gemini service is working!',
        extractedInfo: response.data.extractedInfo,
        rawResponse: response.data.rawResponse
      });
    } else {
      res.json({
        success: false,
        message: 'Python Gemini service responded with error',
        error: response.data.error
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Python service test failed', 
      details: error.message 
    });
  }
});

module.exports = router;
