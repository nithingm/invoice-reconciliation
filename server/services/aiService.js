/**
 * AI SERVICE - LiteLLM Integration
 * ===================================
 * 
 * Handles all AI-related operations:
 * - Intent recognition and information extraction
 * - General conversation handling
 * - Context-aware prompt building
 */

const litellm = require('litellm');
const { getExtractionPrompt, getGeneralQueryPrompt, buildContextInfo } = require('../config/aiConfig');
const database = require('../data/database');
const axios = require('axios');

/**
 * Check if a model is a Gemini model that needs Python processing
 * @param {string} model - The model name
 * @returns {boolean} - True if it's a Gemini model
 */
function isGeminiModel(model) {
  return model.startsWith('gemini-') || model.startsWith('google/');
}

/**
 * Process AI query with Python microservice for Gemini models
 * @param {string} message - User's message
 * @param {string} model - The Gemini model to use
 * @param {object} conversationContext - Current conversation context
 * @returns {Promise<object>} - Extracted information with intent
 */
async function processWithPythonGemini(message, model, conversationContext = null) {
  try {
    console.log(`🐍 Processing with Python Gemini: ${model}`);

    const contextInfo = buildContextInfo(conversationContext);
    const prompt = getExtractionPrompt(message, contextInfo);

    // Clean up model name for Python service
    const cleanModel = model.replace('google/', '').replace('gemini/', '');

    const response = await axios.post('http://localhost:5001/ai/process', {
      message: prompt,
      model: cleanModel,
      context: conversationContext
    });

    if (response.data.success) {
      console.log('✅ Python Gemini processing successful');
      return response.data.extractedInfo;
    } else {
      throw new Error(response.data.error || 'Python processing failed');
    }

  } catch (error) {
    console.error('❌ Python Gemini processing error:', error.message);
    throw error;
  }
}

/**
 * Extract information and intent from user message using a specified LLM
 * 
 * @param {string} message - User's message
 * @param {string} model - The model to use (e.g., 'ollama/llama3', 'gemini-1.5-flash')
 * @param {object} conversationContext - Current conversation context
 * @returns {Promise<object>} - Extracted information with intent
 */
async function extractInfoWithLLM(message, model, conversationContext = null) {
  try {
    // Check if this is a Gemini model that needs Python LiteLLM processing
    if (isGeminiModel(model)) {
      return await processWithPythonGemini(message, model, conversationContext);
    }

    // Build context-aware prompt using external template
    const contextInfo = buildContextInfo(conversationContext);
    const prompt = getExtractionPrompt(message, contextInfo);

    console.log(`🧠 Sending prompt to ${model}:`, prompt.substring(0, 200) + '...');

    // Use Node.js LiteLLM for non-Gemini models
    const response = await litellm.completion({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    console.log('📡 LLM raw response:', response.choices[0].message.content);

    // Parse the JSON response
    const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed:', parsed);

        // Ensure numeric fields are numbers
        if (parsed.creditAmount && typeof parsed.creditAmount === 'string') {
          parsed.creditAmount = parseFloat(parsed.creditAmount) || 0;
        }
        if (parsed.missingQuantity && typeof parsed.missingQuantity === 'string') {
          parsed.missingQuantity = parseInt(parsed.missingQuantity) || 0;
        }
        if (parsed.paidAmount && typeof parsed.paidAmount === 'string') {
          parsed.paidAmount = parseFloat(parsed.paidAmount) || 0;
        }
        if (parsed.invoiceAmount && typeof parsed.invoiceAmount === 'string') {
          parsed.invoiceAmount = parseFloat(parsed.invoiceAmount) || 0;
        }

        // Apply conversation context for missing fields (but don't override explicit mentions)
        if (conversationContext) {
          // Check if customer ID was explicitly mentioned in the message
          const explicitCustomerId = message.toLowerCase().includes('cust');

          if (!parsed.customerName && !explicitCustomerId && conversationContext.customerName) {
            parsed.customerName = conversationContext.customerName;
            console.log(`📋 Using context customer name: ${conversationContext.customerName}`);
          }
          if (!parsed.customerId && !explicitCustomerId && conversationContext.customerId) {
            parsed.customerId = conversationContext.customerId;
            console.log(`📋 Using context customer ID: ${conversationContext.customerId}`);
          }
          if (!parsed.invoiceId && conversationContext.lastInvoiceId) {
            parsed.invoiceId = conversationContext.lastInvoiceId;
          }
        }

        // CUSTOMER VALIDATION: Check if customer exists
        if (parsed.customerName && !parsed.customerId) {
          const customer = database.getCustomerByName(parsed.customerName);
          if (customer) {
            parsed.customerId = customer.id;
            console.log(`✅ Customer validated: ${parsed.customerName} -> ${customer.id}`);
          } else {
            console.log(`❌ Customer not found: ${parsed.customerName}`);
            // Don't set customerId, let handlers deal with validation
          }
        }

        return parsed;
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError);
        return { intent: 'general', error: 'Failed to parse AI response' };
      }
    } else {
      console.error('❌ No JSON found in LLM response');
      return { intent: 'general', error: 'No structured response from AI' };
    }

  } catch (error) {
    console.error(`❌ ${model} extraction error:`, error);
    return { intent: 'general', error: error.message };
  }
}

/**
 * Handle general conversation queries using a specified LLM
 * 
 * @param {string} message - User's message
 * @param {string} model - The model to use (e.g., 'ollama/llama3', 'gemini-1.5-flash')
 * @returns {Promise<object>} - Response object with message and type
 */
async function handleGeneralQuery(message, model) {
  try {
    // Check if this is a Gemini model that needs Python processing
    if (isGeminiModel(model)) {
      const prompt = getGeneralQueryPrompt(message);

      const cleanModel = model.replace('google/', '').replace('gemini/', '');

      const response = await axios.post('http://localhost:5001/ai/general', {
        message: prompt,
        model: cleanModel
      });

      if (response.data.success) {
        return {
          message: response.data.response,
          type: 'general'
        };
      } else {
        throw new Error(response.data.error || 'Python processing failed');
      }
    }

    // Use Node.js LiteLLM for non-Gemini models
    const prompt = getGeneralQueryPrompt(message);

    console.log(`💬 General query prompt to ${model}:`, prompt.substring(0, 200) + '...');

    const response = await litellm.completion({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    console.log('💬 General query response:', response.choices[0].message.content);

    return {
      message: response.choices[0].message.content,
      type: 'general'
    };

  } catch (error) {
    console.error('❌ General query error:', error);
    return {
      message: 'I apologize, but I\'m having trouble processing your request right now. Please try again or contact support.',
      type: 'error'
    };
  }
}

/**
 * Fetches available Ollama models from the local Ollama API.
 * @returns {Promise<Array<string>>} - A list of available Ollama model names.
 */
async function getOllamaModels() {
  try {
    const response = await axios.get('http://localhost:11434/api/tags');
    return response.data.models.map(model => `ollama/${model.name}`);
  } catch (error) {
    console.error('Error fetching Ollama models:', error.message);
    return []; // Return empty array on error
  }
}

/**
 * Test Gemini connectivity using Python microservice
 * @returns {Promise<object>} - Test result
 */
async function testGeminiConnection() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: 'No Gemini API key configured' };
    }

    console.log('🧪 Testing Gemini connection via Python microservice...');

    // Try the newer Gemini models you specified
    const modelFormats = [
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite'
    ];

    for (const modelFormat of modelFormats) {
      try {
        console.log(`Testing model: ${modelFormat}`);

        const response = await axios.post('http://localhost:5001/ai/general', {
          message: 'Hello, this is a test message. Please respond with "Connection successful!"',
          model: modelFormat
        });

        if (response.data.success) {
          console.log('✅ Gemini connection successful:', response.data.response);
          return {
            success: true,
            message: `Gemini connection successful via Python LiteLLM (${modelFormat})`,
            response: response.data.response,
            modelFormat: modelFormat
          };
        } else {
          console.log(`❌ Failed with ${modelFormat}:`, response.data.error);
          continue;
        }
      } catch (formatError) {
        console.log(`❌ Failed with ${modelFormat}:`, formatError.message);
        continue;
      }
    }

    return {
      success: false,
      error: 'All model formats failed',
      details: 'Tried: ' + modelFormats.join(', ')
    };

  } catch (error) {
    console.error('❌ Gemini connection test failed:', error.message);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

/**
 * Uses the LLM to select the best tool to use from a dynamic list.
 * @param {string} message The user's message.
 * @param {string} model The AI model to use.
 * @param {Array<string>} availableTools A list of tool names.
 * @returns {Promise<object>} e.g., { tool: 'findCustomersByName', args: { name: 'John' } }
 */
async function selectTool(message, model, availableTools) {
  const toolSelectionPrompt = `
    Given the user's message, identify the single best tool to call.
    The available tools are: [${availableTools.join(', ')}].

    User Message: "${message}"

    Analyze the message and determine the most appropriate tool and the arguments required to call it.
    If you need to find a customer, use "findCustomersByName".
    If you need to apply credit, the primary tool is "applyCreditToInvoice".

    Respond with only a single JSON object in the format:
    { "tool": "<tool_name>", "args": { "<arg_name>": "<value>" } }
    If no specific tool seems appropriate, respond with { "tool": "unknown" }.
  `;

  try {
    const response = await litellm.completion({
      model: model,
      messages: [{ role: 'user', content: toolSelectionPrompt }],
    });

    const jsonResponse = JSON.parse(response.choices[0].message.content);
    return jsonResponse;
  } catch (e) {
    console.error("Failed to parse tool selection response:", e);
    return { tool: 'unknown' };
  }
}

/**
 * Uses the LLM to generate a human-friendly clarification question.
 * @param {Array} ambiguousResults The list of items the user needs to choose from.
 * @param {string} originalIntent The original goal (e.g., 'findCustomersByName').
 * @returns {Promise<string>} The question to ask the user.
 */
async function generateClarificationQuestion(ambiguousResults, originalIntent) {
  const itemType = originalIntent.toLowerCase().includes('customer') ? 'customer' : 'item';
  const prompt = `
    A search for a ${itemType} returned multiple results. Your task is to generate a clear, friendly, multiple-choice question to ask the user for clarification.

    Here are the search results:
    ${JSON.stringify(ambiguousResults.map(r => ({ id: r.id, name: r.name })), null, 2)}

    Generate only the question itself. Be concise and helpful.
  `;

  try {
    const response = await litellm.completion({
      model: 'gemini-2.5-flash-lite', // Use a fast model for simple generation
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (e) {
    console.error("Failed to generate clarification question:", e);
    return "I found multiple matches. Please specify which one you meant.";
  }
}

module.exports = {
  extractInfoWithLLM,
  handleGeneralQuery,
  getOllamaModels,
  testGeminiConnection,
  selectTool,
  generateClarificationQuestion
};
