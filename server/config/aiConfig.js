/**
 * AI Configuration for TransMaster Pro
 * Contains all AI prompts, response templates, and message formatters
 */

// =============================================================================
// AI PROMPTS
// =============================================================================

/**
 * Main extraction prompt for analyzing customer messages
 * @param {string} message - The customer message to analyze
 * @param {string} contextInfo - Additional context information
 * @returns {string} - The complete prompt for Ollama
 */
function getExtractionPrompt(message, contextInfo = '') {
  return `You are an AI assistant for TransMaster Pro transmission company. Analyze this customer message and extract information intelligently.

Customer Message: "${message}"${contextInfo}

Your task is to extract the following information from the message:

INTENT CLASSIFICATION:
- add_credits: Customer wants to add/give NEW credits to a customer account (keywords: add, give, create, grant + credits + customer name)
- credit_application: Customer wants to apply/use EXISTING credits to pay invoices (keywords: apply, use + credits + customer name OR customer ID)
- credit_balance_inquiry: Customer wants to check/show/view available credit balance (keywords: show, check, balance, available, how much, what credits, view + credits)
- purchase_history: Customer wants to see their purchase history (keywords: history, purchases, transactions)
- invoice_inquiry: Customer wants to check invoice details (keywords: invoice, INV)
- quantity_discrepancy: Customer reports missing/incorrect quantities (keywords: missing, received less, short, quantity, wrong amount received)
- damage_report: Customer reports damaged items (keywords: damaged, broken, defective, cracked)
- credit_memo_approval: Customer responds to credit memo options (keywords: yes, approve, apply to, refund)
- partial_payment: Customer paid less than invoice amount and needs credit deduction (keywords: paid, payment, less than, partial, remaining)
- general: General inquiry or greeting

IMPORTANT: If the message contains "apply" + "$" + "credit" + customer name, it is ALWAYS credit_application, NOT quantity_discrepancy.

EXTRACTION RULES:
1. customerName: Extract full customer name if mentioned (e.g., "John Smith", "Sarah Johnson")
2. customerId: ONLY extract if explicit customer ID is mentioned (e.g., "CUST001", "CUST002") - DO NOT put customer names here
3. creditAmount: Extract numeric credit amount if mentioned
4. invoiceId: Extract invoice ID if mentioned
5. missingQuantity: Extract missing quantity for discrepancy reports
6. itemDescription: Extract item/product description
7. damageDescription: Extract damage details
8. customerChoice: Extract customer preference for credit handling
9. paidAmount: Extract amount customer actually paid for partial payments
10. invoiceAmount: Extract total invoice amount ONLY if explicitly mentioned (e.g., "paid 800 but total was 950"). If not mentioned, set to null

IMPORTANT:
- Customer names go in "customerName" field
- Customer IDs (CUST001, CUST002, etc.) go in "customerId" field
- Never put a customer name in the customerId field

EXAMPLES:
- "Add 50 credits to Sarah Johnson" → intent: add_credits, customerName: "Sarah Johnson", creditAmount: 50
- "Give 100 credits to John Smith" → intent: add_credits, customerName: "John Smith", creditAmount: 100
- "Create 250 credits for CUST001" → intent: add_credits, customerId: "CUST001", creditAmount: 250
- "Apply 250$ credit for Mike Wilson" → intent: credit_application, customerName: "Mike Wilson", creditAmount: 250
- "Use 500 credits for John Smith" → intent: credit_application, customerName: "John Smith", creditAmount: 500
- "Apply credits for Sarah Johnson" → intent: credit_application, customerName: "Sarah Johnson"
- "Apply 1000 credits to invoice INV001 for John Smith" → intent: credit_application, customerName: "John Smith", creditAmount: 1000, invoiceId: "INV001"
- "Apply $10000 credit for CUST001 to invoice INV001" → intent: credit_application, customerId: "CUST001", creditAmount: 10000, invoiceId: "INV001"
- "Apply $100 to INV001 for CUST001" → intent: credit_application, customerId: "CUST001", creditAmount: 100, invoiceId: "INV001"
- "Apply $5 credits from CUST001 to invoice INV001" → intent: credit_application, customerId: "CUST001", creditAmount: 5, invoiceId: "INV001"
- "Apply 20$ credit for Lisa Chen" → intent: credit_application, customerName: "Lisa Chen", creditAmount: 20
- "Show credits for John" → intent: credit_balance_inquiry, customerName: "John"
- "How much credits are available for John Smith?" → intent: credit_balance_inquiry, customerName: "John Smith"
- "Check credit balance for CUST001" → intent: credit_balance_inquiry, customerId: "CUST001"
- "What credits does John have?" → intent: credit_balance_inquiry, customerName: "John"
- "my credit balance" → intent: credit_balance_inquiry (use context for customer)
- "Invoice INV-2025-001 billed 100 units but we received 95. Fix?" → intent: quantity_discrepancy, invoiceId: "INV-2025-001", missingQuantity: 5
- "We received damaged transmission on invoice INV002" → intent: damage_report, invoiceId: "INV002", itemDescription: "transmission"
- "apply to account" → intent: credit_memo_approval, customerChoice: "apply to account"
- "John Smith paid 4000 for invoice INV008 but total was 5000" → intent: partial_payment, customerName: "John Smith", invoiceId: "INV008", paidAmount: 4000, invoiceAmount: 5000
- "Lisa Chen paid 800 for invoice INV009" → intent: partial_payment, customerName: "Lisa Chen", invoiceId: "INV009", paidAmount: 800, invoiceAmount: null (let system look up actual invoice amount)

Return ONLY valid JSON with no additional text:
{
  "intent": "quantity_discrepancy",
  "customerName": null,
  "customerId": null,
  "creditAmount": 0,
  "invoiceId": "INV-2025-001",
  "missingQuantity": 5,
  "itemDescription": null,
  "damageDescription": null,
  "customerChoice": null,
  "targetInvoiceId": null
}`;
}

/**
 * General query prompt for handling non-specific customer inquiries
 * @param {string} message - The customer message
 * @returns {string} - The complete prompt for general queries
 */
function getGeneralQueryPrompt(message) {
  return `You are a customer service AI for TransMaster Pro transmission company.

Customer Service Context:
- You help company staff apply customer credits to invoices
- Credits are earned from previous purchases and have expiry dates
- Staff requests: "Apply $500 credit to invoice INV001 for John Smith"
- Available customers: CUST001 (John Smith), CUST002 (Sarah Johnson), CUST003 (Mike Wilson)
- Available invoices: INV001, INV002, INV003, INV004

User message: "${message}"

Provide helpful responses for:
- Credit applications: Guide staff on proper format
- Credit inquiries: Show available credits and balances
- Invoice questions: Provide invoice details
- General help: Explain credit system and procedures

Keep responses professional and focused on customer service operations.`;
}

/**
 * Build context information string for prompts
 * @param {Object} conversationContext - The conversation context object
 * @returns {string} - Formatted context information
 */
function buildContextInfo(conversationContext) {
  if (!conversationContext) return '';
  
  let contextInfo = '';
  if (conversationContext.customerName) {
    contextInfo += `\nKnown Customer: ${conversationContext.customerName}`;
  }
  if (conversationContext.customerId) {
    contextInfo += `\nKnown Customer ID: ${conversationContext.customerId}`;
  }
  if (conversationContext.lastInvoiceId) {
    contextInfo += `\nLast Invoice Discussed: ${conversationContext.lastInvoiceId}`;
  }
  return contextInfo;
}

// =============================================================================
// RESPONSE TEMPLATES
// =============================================================================

/**
 * Format credit application success response
 * @param {Object} transaction - Transaction details from Python microservice
 * @returns {string} - Formatted success message
 */
function formatCreditApplicationSuccess(transaction) {
  return `Credit Application Successful!\n\n` +
         `Customer: ${transaction.customer_name}\n` +
         `Invoice: ${transaction.invoice_id}\n` +
         `Credits Applied: $${transaction.credit_amount_applied}\n` +
         `Original Amount: $${transaction.original_invoice_amount}\n` +
         `New Invoice Amount: $${transaction.new_invoice_amount}\n` +
         `Remaining Credits: $${transaction.remaining_credits}\n\n` +
         ` A new invoice will be sent to ${transaction.customer_email}`;
}

/**
 * Format credit balance response
 * @param {Object} customer - Customer information
 * @param {Object} credits - Credit information
 * @returns {string} - Formatted balance message
 */
function formatCreditBalance(customer, credits) {
  console.log('formatCreditBalance called with:', { customer, credits });
  console.log('credits.total_available:', credits?.total_available);

  let response = `Credit Balance for ${customer.name} (${customer.id})\n\n`;
  response += `Email: ${customer.email}\n`;
  response += `Total Available Credits: $${credits.total_available.toFixed(2)}\n\n`;

  if (credits.active_credits && credits.active_credits.length > 0) {
    response += `Active Credits:\n`;
    credits.active_credits.forEach(credit => {
      response += `• $${credit.amount.toFixed(2)}\n`;
      response += `  ID: ${credit.id} \nExpires: ${credit.expiry_date}\n`;
      response += `  Category: ${credit.category} \n Status: ${credit.status}\n`;
      if (credit.usage_history && credit.usage_history.length > 0) {
        response += `  Usage: $${(credit.original_amount - credit.amount).toFixed(2)} used\n`;
      }
      response += `\n`;
    });
  } else {
    response += `No active credits available.\n`;
  }

  if (credits.expired_credits_count > 0) {
    response += `\nExpired Credits: ${credits.expired_credits_count}\n`;
  }

  if (credits.used_credits_count > 0) {
    response += `Used Credits: ${credits.used_credits_count}\n`;
  }

  return response;
}

/**
 * Format purchase history response
 * @param {Object} customer - Customer information
 * @param {Array} purchases - Purchase history array
 * @returns {string} - Formatted purchase history message
 */
function formatPurchaseHistory(customer, purchases) {
  let response = `Purchase History for ${customer.name} (${customer.id})\n\n`;
  response += `Email: ${customer.email}\n\n`;

  if (purchases.length > 0) {
    response += `Purchase History (${purchases.length} invoices):\n\n`;
    purchases.forEach(purchase => {
      response += ` ${purchase.invoiceId} - $${purchase.amount.toFixed(2)} (${purchase.date})\n`;
      response += `   Product: ${purchase.product}\n`;
      response += `   Status: ${purchase.status} | Payment: ${purchase.paymentStatus}\n`;

      if (purchase.creditsApplied > 0) {
        response += `   Current Amount: $${purchase.currentAmount.toFixed(2)} (after $${purchase.creditsApplied.toFixed(2)} credits)\n`;
      }

      if (purchase.creditsEarned > 0) {
        response += `   Credits Earned: $${purchase.creditsEarned.toFixed(2)}\n`;
      }

      response += `   Items: ${purchase.itemCount}\n\n`;
    });
  } else {
    response += `No purchase history found.\n`;
  }

  return response;
}

/**
 * Format quantity discrepancy response
 * @param {Object} customerInfo - Customer information
 * @param {Object} invoiceInfo - Invoice information
 * @param {Object} creditMemo - Credit memo information
 * @returns {string} - Formatted quantity discrepancy message
 */
function formatQuantityDiscrepancy(customerInfo, invoiceInfo, creditMemo) {
  let responseMessage = ` Quantity Discrepancy Processed\n\n`;
  responseMessage += `Customer: ${customerInfo.name} (${customerInfo.id})\n`;
  responseMessage += `Invoice: ${invoiceInfo.id} - ${invoiceInfo.description}\n\n`;
  responseMessage += `Credit Memo Generated:\n`;
  responseMessage += `- Amount: $${creditMemo.amount}\n`;
  responseMessage += `- Reason: ${creditMemo.reason}\n`;
  responseMessage += `- Status: ${creditMemo.status}\n\n`;

  if (invoiceInfo.payment_status === 'paid') {
    responseMessage += `Since this invoice is already paid, you can:\n`;
    responseMessage += `1. Apply credit to your account for future purchases\n`;
    responseMessage += `2. Issue refund to original payment method\n\n`;
  } else {
    responseMessage += `Options available:\n`;
    responseMessage += `1. Apply credit to current invoice\n`;
    responseMessage += `2. Apply credit to your account for future purchases\n\n`;
    responseMessage += `Please let me know your preference: "Apply to invoice" or "Apply to account"`;
  }

  return responseMessage;
}

/**
 * Format damage report response
 * @param {Object} customerInfo - Customer information
 * @param {Object} invoiceInfo - Invoice information
 * @param {Object} damageReport - Damage report information
 * @param {Object} creditMemo - Credit memo information
 * @returns {string} - Formatted damage report message
 */
function formatDamageReport(customerInfo, invoiceInfo, damageReport, creditMemo) {
  let responseMessage = ` **Damage Report Processed**\n\n`;
  responseMessage += `Customer: ${customerInfo.name} (${customerInfo.id})\n`;
  responseMessage += `Invoice: ${invoiceInfo.id} - ${invoiceInfo.description}\n\n`;
  responseMessage += `Damage Report:\n`;
  responseMessage += `- Report ID: ${damageReport.id}\n`;
  responseMessage += `- Item: ${creditMemo.items[0].description}\n`;
  responseMessage += `- Damage: ${damageReport.description}\n`;
  responseMessage += `- Status: ${damageReport.status}\n\n`;
  responseMessage += `Credit Memo Generated:\n`;
  responseMessage += `- Amount: $${creditMemo.amount}\n`;
  responseMessage += `- Status: ${creditMemo.status}\n\n`;

  if (invoiceInfo.payment_status === 'paid') {
    responseMessage += `Since this invoice is already paid, your options are:\n`;
    responseMessage += `1. Apply credit to your account for future purchases\n`;
    responseMessage += `2. Issue refund to original payment method\n\n`;
    responseMessage += `Please let me know your preference: "Apply to account" or "Issue refund"`;
  } else {
    responseMessage += `Options available:\n`;
    responseMessage += `1. Apply credit to current invoice\n`;
    responseMessage += `2. Apply credit to your account for future purchases\n\n`;
    responseMessage += `Please let me know your preference: "Apply to invoice" or "Apply to account"`;
  }

  return responseMessage;
}

/**
 * Format credit memo approval response
 * @param {Object} creditMemo - Credit memo information
 * @param {string} choice - Customer choice (apply_to_invoice, apply_to_account, refund)
 * @returns {string} - Formatted credit memo approval message
 */
function formatCreditMemoApproval(creditMemo, choice) {
  let responseMessage = ` Credit Memo Approved\n\n`;
  responseMessage += `Credit Memo ID: ${creditMemo.id}\n`;
  responseMessage += `Amount: $${creditMemo.amount}\n`;
  responseMessage += `Status: ${creditMemo.status}\n`;
  responseMessage += `Customer Choice: ${creditMemo.customerChoice}\n\n`;

  if (choice === 'apply_to_invoice') {
    responseMessage += ` Credit has been applied to invoice ${creditMemo.targetInvoiceId}\n`;
    responseMessage += ` Vendor notification sent\n`;
    responseMessage += ` Action logged in accounting system`;
  } else if (choice === 'apply_to_account') {
    responseMessage += ` Credit has been added to your account for future purchases\n`;
    responseMessage += ` AP team and vendor notified\n`;
    responseMessage += `Credit will be available for your next order`;
  } else if (choice === 'refund') {
    responseMessage += ` Refund has been processed to your original payment method\n`;
    responseMessage += ` Confirmation email sent\n`;
    responseMessage += ` Please allow 3-5 business days for processing`;
  }

  return responseMessage;
}

/**
 * Format clarification message for missing invoice
 * @param {Object} recentInvoice - Most recent invoice information
 * @param {string} type - Type of clarification (quantity_discrepancy or damage_report)
 * @returns {string} - Formatted clarification message
 */
function formatClarificationMessage(recentInvoice, type) {
  const baseMessage = `I found your most recent invoice: ${recentInvoice.id} - ${recentInvoice.description} (${recentInvoice.date})\n\n`;
  
  if (type === 'quantity_discrepancy') {
    return baseMessage + `Is this the invoice with the quantity discrepancy? If yes, please specify the missing quantity and item. If not, please provide the correct invoice ID.`;
  } else if (type === 'damage_report') {
    return baseMessage + `Is this the invoice with the damaged item? If yes, please specify which item was damaged. If not, please provide the correct invoice ID.`;
  }
  
  return baseMessage + `Is this the correct invoice? Please confirm or provide the correct invoice ID.`;
}

/**
 * Format partial payment processing result
 * @param {Object} result - Processing result from Python microservice
 * @returns {string} - Formatted partial payment message
 */
function formatPartialPaymentResult(result) {
  if (result.success) {
    if (result.invoice_fully_paid) {
      return `Partial Payment Processed Successfully

Customer: ${result.customer_name}
Invoice: ${result.invoice_id}
Payment Received: $${result.paid_amount.toFixed(2)}
Credits Applied: $${result.credits_applied.toFixed(2)}
Invoice Status:  FULLY PAID

Credit Details:
${result.applied_credits.map(credit =>
  `• $${credit.amount.toFixed(2)} from ${credit.id} (${credit.category})`
).join('\n')}

Remaining Customer Credits: $${result.remaining_credits.toFixed(2)}

 Payment confirmation will be sent to ${result.customer_email}`;
    } else {
      return `Partial Payment Processed - Balance Remaining

Customer: ${result.customer_name}
Invoice: ${result.invoice_id}
Payment Received: $${result.paid_amount.toFixed(2)}
Credits Applied: $${result.credits_applied.toFixed(2)}
Remaining Balance: $${result.remaining_balance.toFixed(2)}

Credit Details:
${result.applied_credits.map(credit =>
  `• $${credit.amount.toFixed(2)} from ${credit.id} (${credit.category})`
).join('\n')}

Remaining Customer Credits:** $${result.remaining_credits.toFixed(2)}

 New invoice for remaining balance ($${result.remaining_balance.toFixed(2)}) will be sent to ${result.customer_email}`;
    }
  } else {
    return `Partial Payment Processing Failed

Customer: ${result.customer_name}
Invoice: ${result.invoice_id}
Payment Received:$${result.paid_amount.toFixed(2)}
Remaining Balance: $${result.remaining_balance.toFixed(2)}

Issue: ${result.error || 'No credits available for deduction'}

New invoice for remaining balance ($${result.remaining_balance.toFixed(2)}) will be sent to ${result.customer_email}`;
  }
}

/**
 * Common error messages
 */
const ERROR_MESSAGES = {
  CUSTOMER_NOT_FOUND: ' Customer not found. Please check the customer ID or name.',
  INVOICE_NOT_FOUND: ' Invoice not found. Please check the invoice ID.',
  SYSTEM_ERROR: 'System Error: ',
  MISSING_CUSTOMER_INFO: ' I need a customer ID or name to process this request. Please specify which customer.',
  MISSING_INVOICE_INFO: ' Please provide the invoice ID for this request.',
  PROCESSING_ERROR: ' An error occurred while processing your request. Please try again.',
  INVALID_CHOICE: ' Please specify a valid choice.',
  MISSING_CREDIT_INFO: ' I need both a customer (ID or name) and credit amount to process a credit application. Please provide both details.',
  MISSING_PAYMENT_INFO: ' I need the customer name, invoice ID, and payment amount to process a partial payment. Please provide all details.'
};

module.exports = {
  // AI Prompts
  getExtractionPrompt,
  getGeneralQueryPrompt,
  buildContextInfo,

  // Response Templates
  formatCreditApplicationSuccess,
  formatCreditBalance,
  formatPurchaseHistory,
  formatQuantityDiscrepancy,
  formatDamageReport,
  formatCreditMemoApproval,
  formatPartialPaymentResult,
  formatClarificationMessage,
  ERROR_MESSAGES
};
