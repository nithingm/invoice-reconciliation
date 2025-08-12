/**
 * GENERAL HANDLER - General Conversation Operations
 * =================================================
 * 
 * Handles general conversation and fallback operations:
 * - General queries and greetings
 * - Fallback responses for unrecognized intents
 * - Help and guidance messages
 */

const { handleGeneralQuery } = require('../services/aiService');

/**
 * HANDLER: General Query
 * 
 * Processes general conversation, greetings, and unrecognized intents
 * Example: "Hello", "How are you?", "What can you help me with?"
 * 
 * Process:
 * 1. Use Ollama LLM for general conversation
 * 2. Provide helpful responses and guidance
 * 3. Maintain friendly, professional tone
 */
async function handleGeneral(message) {
  try {
    console.log('💬 Processing general query:', message);

    // Use AI service for general conversation
    const response = await handleGeneralQuery(message);
    
    return response;

  } catch (error) {
    console.error('❌ General query error:', error);
    return {
      message: 'Hello! I am your AI assistant. I can help you with:\n\n' +
               '• Invoice inquiries and credit validation\n' +
               '• Quantity discrepancy reports\n' +
               '• Damage reports and credit memos\n' +
               '• Account balance and purchase history\n' +
               '• General transmission service questions\n\n' +
               'How can I assist you today?',
      type: 'general'
    };
  }
}

module.exports = {
  handleGeneral
};
