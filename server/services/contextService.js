/**
 * CONTEXT SERVICE - Conversation Context Management
 * =================================================
 * 
 * Manages conversation context across multiple messages:
 * - Session initialization and updates
 * - Context persistence for multi-step workflows
 * - Customer and invoice context tracking
 * - Credit memo state management
 */

/**
 * Store conversation sessions for maintaining context across messages
 * Each session contains:
 * - customerId: Current customer being discussed
 * - customerName: Current customer name
 * - lastInvoiceId: Last invoice mentioned
 * - pendingCreditMemoId: Credit memo awaiting approval
 * - messageHistory: Previous messages for context
 */
const conversationSessions = new Map();

/**
 * Initialize or get existing conversation session
 * 
 * @param {string} sessionId - Unique session identifier
 * @returns {object} - Session context object
 */
function initializeSession(sessionId) {
  if (!conversationSessions.has(sessionId)) {
    conversationSessions.set(sessionId, {
      customerId: null,           // Current customer being discussed
      customerName: null,         // Current customer name
      lastInvoiceId: null,        // Last invoice mentioned
      pendingCreditMemoId: null,  // Credit memo awaiting approval
      messageHistory: []          // Previous messages for context
    });
  }
  return conversationSessions.get(sessionId);
}

/**
 * Update session context with new information
 * 
 * @param {string} sessionId - Session identifier
 * @param {object} contextUpdates - Context updates to apply
 * @param {array} messageHistory - Updated message history
 * @returns {object} - Updated session context
 */
function updateSessionContext(sessionId, contextUpdates = {}, messageHistory = []) {
  const session = initializeSession(sessionId);
  
  // Apply context updates
  Object.assign(session, contextUpdates);
  
  // Update message history
  session.messageHistory = messageHistory;
  
  return session;
}

/**
 * Get current session context
 * 
 * @param {string} sessionId - Session identifier
 * @returns {object|null} - Session context or null if not found
 */
function getSessionContext(sessionId) {
  return conversationSessions.get(sessionId) || null;
}

/**
 * Clear specific context fields (e.g., after completing a workflow)
 * 
 * @param {string} sessionId - Session identifier
 * @param {array} fieldsToClear - Array of field names to clear
 */
function clearContextFields(sessionId, fieldsToClear = []) {
  const session = getSessionContext(sessionId);
  if (session) {
    fieldsToClear.forEach(field => {
      session[field] = null;
    });
  }
}

/**
 * Set pending credit memo for approval workflow
 * 
 * @param {string} sessionId - Session identifier
 * @param {string} creditMemoId - Credit memo ID awaiting approval
 * @param {string} customerId - Customer ID
 * @param {string} customerName - Customer name
 */
function setPendingCreditMemo(sessionId, creditMemoId, customerId, customerName) {
  const session = initializeSession(sessionId);
  session.pendingCreditMemoId = creditMemoId;
  session.customerId = customerId;
  session.customerName = customerName;
}

/**
 * Clear pending credit memo after approval/rejection
 * 
 * @param {string} sessionId - Session identifier
 */
function clearPendingCreditMemo(sessionId) {
  clearContextFields(sessionId, ['pendingCreditMemoId']);
}

/**
 * Update customer context
 * 
 * @param {string} sessionId - Session identifier
 * @param {string} customerId - Customer ID
 * @param {string} customerName - Customer name
 */
function updateCustomerContext(sessionId, customerId, customerName) {
  const session = initializeSession(sessionId);
  if (customerId) session.customerId = customerId;
  if (customerName) session.customerName = customerName;
}

/**
 * Update invoice context
 * 
 * @param {string} sessionId - Session identifier
 * @param {string} invoiceId - Invoice ID
 */
function updateInvoiceContext(sessionId, invoiceId) {
  const session = initializeSession(sessionId);
  if (invoiceId) session.lastInvoiceId = invoiceId;
}

/**
 * Get all active sessions (for debugging/monitoring)
 * 
 * @returns {Map} - All conversation sessions
 */
function getAllSessions() {
  return conversationSessions;
}

/**
 * Clean up old sessions (optional - for memory management)
 * 
 * @param {number} maxAgeMinutes - Maximum age in minutes
 */
function cleanupOldSessions(maxAgeMinutes = 60) {
  const cutoffTime = Date.now() - (maxAgeMinutes * 60 * 1000);
  
  for (const [sessionId, session] of conversationSessions.entries()) {
    // If session has a lastActivity timestamp and it's old, remove it
    if (session.lastActivity && session.lastActivity < cutoffTime) {
      conversationSessions.delete(sessionId);
      console.log(`🧹 Cleaned up old session: ${sessionId}`);
    }
  }
}

/**
 * Update session activity timestamp
 * 
 * @param {string} sessionId - Session identifier
 */
function updateSessionActivity(sessionId) {
  const session = getSessionContext(sessionId);
  if (session) {
    session.lastActivity = Date.now();
  }
}

module.exports = {
  initializeSession,
  updateSessionContext,
  getSessionContext,
  clearContextFields,
  setPendingCreditMemo,
  clearPendingCreditMemo,
  updateCustomerContext,
  updateInvoiceContext,
  getAllSessions,
  cleanupOldSessions,
  updateSessionActivity
};
