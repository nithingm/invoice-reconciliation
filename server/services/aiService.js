/**
 * AI SERVICE - Ollama LLM Integration
 * ===================================
 * 
 * Handles all AI-related operations:
 * - Intent recognition and information extraction
 * - General conversation handling
 * - Context-aware prompt building
 */

const { getExtractionPrompt, getGeneralQueryPrompt, buildContextInfo } = require('../config/aiConfig');
const database = require('../data/database');

/**
 * Extract information and intent from user message using Ollama LLM
 * 
 * @param {string} message - User's message
 * @param {object} conversationContext - Current conversation context
 * @returns {Promise<object>} - Extracted information with intent
 */
async function extractInfoWithOllama(message, conversationContext = null) {
  try {
    const { Ollama } = require('ollama');
    const ollama = new Ollama({ host: 'http://localhost:11434' });

    // Build context-aware prompt using external template
    const contextInfo = buildContextInfo(conversationContext);
    const prompt = getExtractionPrompt(message, contextInfo);

    console.log(' Sending prompt to Ollama:', prompt.substring(0, 200) + '...');

    const response = await ollama.chat({
      model: 'llama3.2:3b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    console.log(' Ollama raw response:', response.message.content);

    // Parse the JSON response
    const jsonMatch = response.message.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(' Successfully parsed:', parsed);

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
            console.log(` Using context customer name: ${conversationContext.customerName}`);
          }
          if (!parsed.customerId && !explicitCustomerId && conversationContext.customerId) {
            parsed.customerId = conversationContext.customerId;
            console.log(` Using context customer ID: ${conversationContext.customerId}`);
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
      console.error('❌ No JSON found in Ollama response');
      return { intent: 'general', error: 'No structured response from AI' };
    }

  } catch (error) {
    console.error('❌ Ollama extraction error:', error);
    return { intent: 'general', error: error.message };
  }
}

/**
 * Handle general conversation queries using Ollama LLM
 * 
 * @param {string} message - User's message
 * @returns {Promise<object>} - Response object with message and type
 */
async function handleGeneralQuery(message) {
  try {
    const { Ollama } = require('ollama');
    const ollama = new Ollama({ host: 'http://localhost:11434' });

    const prompt = getGeneralQueryPrompt(message);

    console.log(' General query prompt:', prompt.substring(0, 200) + '...');

    const response = await ollama.chat({
      model: 'llama3.2:3b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    console.log(' General query response:', response.message.content);

    return {
      message: response.message.content,
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

module.exports = {
  extractInfoWithOllama,
  handleGeneralQuery
};
