/**
 * SOCKET CONFIGURATION - Real-time Chat Setup
 * ============================================
 * 
 * Configures Socket.IO for real-time chat communication:
 * - Connection handling
 * - Message processing
 * - Context management
 * - Error handling
 */

const { extractInfoWithOllama } = require('../services/aiService');
const { updateSessionContext, updateSessionActivity } = require('../services/contextService');
const { handleCreditApplication, handleCreditBalanceInquiry, handleCreditMemoApproval } = require('../handlers/creditHandler');
const { handleInvoiceInquiry, handlePurchaseHistoryInquiry } = require('../handlers/invoiceHandler');
const { handleQuantityDiscrepancy, handleDamageReport } = require('../handlers/discrepancyHandler');
const { handlePartialPayment } = require('../handlers/paymentHandler');
const { handleGeneral } = require('../handlers/generalHandler');

/**
 * Main AI Processing Pipeline - The Heart of the Chatbot
 * 
 * This function orchestrates the entire AI workflow:
 * 1. Uses Ollama LLM to understand user intent and extract information
 * 2. Routes to appropriate business logic handler based on intent
 * 3. Returns formatted response to the user
 * 
 * SUPPORTED INTENTS:
 * - credit_application: Apply credits to invoices
 * - credit_balance_inquiry: Check available credit balance
 * - purchase_history: View customer purchase history
 * - invoice_inquiry: Get invoice details
 * - quantity_discrepancy: Report missing/incorrect quantities
 * - damage_report: Report damaged items
 * - credit_memo_approval: Approve credit memo options
 * - partial_payment: Process partial payments with credit deduction
 * - general: General conversation and greetings
 */
async function processAIQuery(message, conversationContext = null) {
  try {
    console.log('🧠 Processing message with AI:', message);
    console.log('📋 Conversation context:', conversationContext);

    // STEP 1: Use Ollama LLM to understand user intent and extract information
    const extractedInfo = await extractInfoWithOllama(message, conversationContext);
    console.log('🔍 Ollama extracted info:', extractedInfo);

    // STEP 2: Route to appropriate handler based on detected intent
    switch (extractedInfo.intent) {
      case 'credit_application':
        return await handleCreditApplication(extractedInfo);

      case 'credit_balance_inquiry':
        return await handleCreditBalanceInquiry(extractedInfo);

      case 'purchase_history':
        return await handlePurchaseHistoryInquiry(extractedInfo);

      case 'invoice_inquiry':
        return await handleInvoiceInquiry(extractedInfo);

      case 'quantity_discrepancy':
        return await handleQuantityDiscrepancy(extractedInfo);

      case 'damage_report':
        return await handleDamageReport(extractedInfo);

      case 'credit_memo_approval':
        return await handleCreditMemoApproval(extractedInfo, conversationContext);

      case 'partial_payment':
        return await handlePartialPayment(extractedInfo);

      case 'general':
      default:
        return await handleGeneral(message);
    }

  } catch (error) {
    console.error('❌ AI Query processing error:', error);
    return {
      message: 'I apologize, but I encountered an error processing your request. Please try again or contact support.',
      type: 'error'
    };
  }
}

/**
 * Configure Socket.IO event handlers
 * 
 * @param {object} io - Socket.IO server instance
 */
function configureSocketHandlers(io) {
  /**
   * Handle real-time chat connections
   * Each user gets a unique socket connection for instant messaging
   */
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    /**
     * Handle incoming chat messages
     * Process: Message → AI Analysis → Business Logic → Response
     */
    socket.on('chat_message', async (data) => {
      try {
        const { message, context, messageHistory } = data;

        // Initialize or update conversation session for context persistence
        let sessionContext = context;
        if (context && context.sessionId) {
          // Update session with current context and message history
          sessionContext = updateSessionContext(
            context.sessionId,
            context,
            messageHistory || []
          );
          
          // Update session activity timestamp
          updateSessionActivity(context.sessionId);
        }

        // Process the message through AI and business logic
        const response = await processAIQuery(message, sessionContext);

        // Update session context with any changes from the response
        if (context && context.sessionId && response.context) {
          updateSessionContext(context.sessionId, response.context);
        }

        // Send response back to client
        socket.emit('ai_response', response);
        
      } catch (error) {
        console.error('Chat message error:', error);
        socket.emit('ai_response', {
          message: 'Sorry, I encountered an error processing your request. Please try again.',
          type: 'error'
        });
      }
    });

    /**
     * Handle user disconnection
     */
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}

module.exports = {
  configureSocketHandlers,
  processAIQuery
};
