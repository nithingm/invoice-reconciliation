/**
 * AGENT PROMPTS - Clarification and Confirmation Templates
 * ========================================================
 * 
 * These functions generate human-friendly prompts for the Clarifying RAG Agent
 * to handle ambiguity and confirm actions before execution.
 */

/**
 * Generate clarification question when multiple results are found
 * @param {string} toolName - Name of the retrieval tool that found multiple results
 * @param {Array} results - Array of ambiguous results
 * @param {Object} extractedInfo - Original extracted information from user
 * @returns {string} - Human-friendly clarification question
 */
function generateClarificationQuestion(toolName, results, extractedInfo) {
  switch (toolName) {
    case 'findCustomerByName':
      return generateCustomerClarification(results, extractedInfo);
    
    case 'findInvoiceById':
      return generateInvoiceClarification(results, extractedInfo);
    
    case 'getPendingInvoices':
      return generatePendingInvoicesClarification(results, extractedInfo);
    
    default:
      return generateGenericClarification(results, extractedInfo);
  }
}

/**
 * Generate customer clarification question
 */
function generateCustomerClarification(customers, extractedInfo) {
  const { customerName } = extractedInfo;
  
  if (customers.length === 0) {
    return `❌ I couldn't find any customers matching "${customerName}". Could you please check the spelling or provide more details?`;
  }
  
  let message = `🔍 I found ${customers.length} customers matching "${customerName}". Which one did you mean?\n\n`;
  
  customers.forEach((customer, index) => {
    const company = customer.company ? ` (${customer.company})` : '';
    message += `${index + 1}. **${customer.name}**${company} - ID: ${customer.id}\n`;
  });
  
  message += `\nPlease tell me the name or ID of the correct customer.`;
  
  return message;
}

/**
 * Generate invoice clarification question
 */
function generateInvoiceClarification(invoices, extractedInfo) {
  const { invoiceId } = extractedInfo;
  
  let message = `🔍 I found multiple invoices. Which one did you mean?\n\n`;
  
  invoices.forEach((invoice, index) => {
    message += `${index + 1}. **${invoice.id}** - $${invoice.amount} (${invoice.status})\n`;
  });
  
  message += `\nPlease specify the exact invoice ID.`;
  
  return message;
}

/**
 * Generate pending invoices clarification question
 */
function generatePendingInvoicesClarification(invoices, extractedInfo) {
  let message = `🔍 I found ${invoices.length} pending invoices. Which one would you like to work with?\n\n`;
  
  invoices.forEach((invoice, index) => {
    const balance = invoice.remainingBalance || invoice.amount;
    message += `${index + 1}. **${invoice.id}** - $${balance} remaining (${invoice.status})\n`;
  });
  
  message += `\nPlease tell me which invoice you'd like to select.`;
  
  return message;
}

/**
 * Generate generic clarification question
 */
function generateGenericClarification(results, extractedInfo) {
  let message = `🔍 I found multiple options. Please help me choose the right one:\n\n`;
  
  results.forEach((result, index) => {
    const name = result.name || result.id || `Option ${index + 1}`;
    message += `${index + 1}. **${name}**\n`;
  });
  
  message += `\nPlease tell me which option you prefer.`;
  
  return message;
}

/**
 * Generate confirmation prompt before executing actions
 * @param {Object} extractedInfo - Original extracted information
 * @param {Object} confirmedData - Data confirmed through clarification
 * @returns {string} - Confirmation prompt
 */
function generateConfirmationPrompt(extractedInfo, confirmedData) {
  const { intent } = extractedInfo;
  
  switch (intent) {
    case 'add_credits':
      return generateAddCreditsConfirmation(extractedInfo, confirmedData);

    case 'credit_application':
      return generateCreditApplicationConfirmation(extractedInfo, confirmedData);

    case 'credit_balance_inquiry':
      return generateCreditBalanceConfirmation(extractedInfo, confirmedData);

    case 'quantity_discrepancy':
      return generateQuantityDiscrepancyConfirmation(extractedInfo, confirmedData);

    case 'damage_report':
      return generateDamageReportConfirmation(extractedInfo, confirmedData);

    case 'partial_payment':
      return generatePartialPaymentConfirmation(extractedInfo, confirmedData);

    case 'payment_plan':
      return generatePaymentPlanConfirmation(extractedInfo, confirmedData);

    case 'bulk_credit_application':
      return generateBulkCreditConfirmation(extractedInfo, confirmedData);

    case 'statement_generation':
      return generateStatementConfirmation(extractedInfo, confirmedData);

    default:
      return generateGenericConfirmation(extractedInfo, confirmedData);
  }
}

/**
 * Generate add credits confirmation
 */
function generateAddCreditsConfirmation(extractedInfo, confirmedData) {
  const { creditAmount, customerName } = extractedInfo;
  const customer = Array.isArray(confirmedData) ? confirmedData[0] : confirmedData;

  const displayName = customer?.name || customerName || 'Unknown Customer';
  const displayId = customer?.id || 'Unknown ID';

  return `💰 **Add Credits Confirmation**\n\n` +
         `I understand you want to add **$${creditAmount}** credits to:\n` +
         `👤 **${displayName}** (${displayId})\n\n` +
         `Please confirm with "yes" to proceed or "no" to cancel.`;
}

/**
 * Generate credit application confirmation
 */
function generateCreditApplicationConfirmation(extractedInfo, confirmedData) {
  const { creditAmount, customerName, customerId, invoiceId } = extractedInfo;
  const customer = Array.isArray(confirmedData) ? confirmedData[0] : confirmedData;

  const displayName = customer?.name || customerName || 'Unknown Customer';
  const displayId = customer?.id || customerId || 'Unknown ID';
  const amount = creditAmount || 'unknown amount';

  let message = `💳 **Apply Credits Confirmation**\n\n`;
  message += `I understand you want to apply **$${amount}** credits for:\n`;
  message += `👤 **${displayName}** (${displayId})\n`;

  if (invoiceId) {
    message += `📄 **Invoice:** ${invoiceId}\n`;
  }

  message += `\nI'll find the best way to apply these credits to pending invoices.\n\n`;
  message += `Please confirm with "yes" to proceed or "no" to cancel.`;

  return message;
}

/**
 * Generate credit balance confirmation
 */
function generateCreditBalanceConfirmation(extractedInfo, confirmedData) {
  const { customerName } = extractedInfo;
  const customer = Array.isArray(confirmedData) ? confirmedData[0] : confirmedData;

  const displayName = customer?.name || customerName || 'Unknown Customer';
  const displayId = customer?.id || 'Unknown ID';

  return `🔍 **Check Credit Balance Confirmation**\n\n` +
         `I understand you want to check the credit balance for:\n` +
         `👤 **${displayName}** (${displayId})\n\n` +
         `Please confirm with "yes" to proceed or "no" to cancel.`;
}

/**
 * Generate quantity discrepancy confirmation
 */
function generateQuantityDiscrepancyConfirmation(extractedInfo, confirmedData) {
  const { invoiceId, missingQuantity, itemDescription } = extractedInfo;
  const customer = confirmedData;
  
  return `📦 **Quantity Discrepancy Confirmation**\n\n` +
         `I'm ready to process a quantity discrepancy for:\n` +
         `👤 **Customer:** ${customer.name} (${customer.id})\n` +
         `📋 **Invoice:** ${invoiceId}\n` +
         `📦 **Missing Quantity:** ${missingQuantity}\n` +
         `🔧 **Item:** ${itemDescription}\n\n` +
         `This will create a credit memo for the missing items. Is this correct? Please confirm with "yes" or "no".`;
}

/**
 * Generate damage report confirmation
 */
function generateDamageReportConfirmation(extractedInfo, confirmedData) {
  const { invoiceId, itemDescription, damageDescription } = extractedInfo;
  const customer = confirmedData;
  
  return `🔧 **Damage Report Confirmation**\n\n` +
         `I'm ready to process a damage report for:\n` +
         ` **Customer:** ${customer.name} (${customer.id})\n` +
         ` **Invoice:** ${invoiceId}\n` +
         ` **Item:** ${itemDescription}\n` +
         ` **Damage:** ${damageDescription}\n\n` +
         `This will create a credit memo for the damaged item. Is this correct? Please confirm with "yes" or "no".`;
}

/**
 * Generate partial payment confirmation
 */
function generatePartialPaymentConfirmation(extractedInfo, confirmedData) {
  const { invoiceId, paidAmount } = extractedInfo;
  const customer = confirmedData;
  
  return `💵 **Partial Payment Confirmation**\n\n` +
         `I'm ready to process a partial payment for:\n` +
         `👤 **Customer:** ${customer.name} (${customer.id})\n` +
         `📋 **Invoice:** ${invoiceId}\n` +
         `💰 **Payment Amount:** $${paidAmount}\n\n` +
         `Is this correct? Please confirm with "yes" or "no".`;
}

/**
 * Generate payment plan confirmation
 */
function generatePaymentPlanConfirmation(extractedInfo, confirmedData) {
  const { monthlyAmount, invoiceIds } = extractedInfo;
  const customer = confirmedData;

  return `📅 **Payment Plan Confirmation**\n\n` +
         `I'm ready to create a payment plan for:\n` +
         `👤 **Customer:** ${customer.name} (${customer.id})\n` +
         `📋 **Invoices:** ${invoiceIds.length} invoices\n` +
         `💰 **Monthly Payment:** $${monthlyAmount}\n\n` +
         `This will set up an automated payment schedule. Is this correct? Please confirm with "yes" or "no".`;
}

/**
 * Generate bulk credit application confirmation
 */
function generateBulkCreditConfirmation(extractedInfo, confirmedData) {
  const { applications } = extractedInfo;
  const customer = confirmedData;

  const totalCredits = applications.reduce((sum, app) => sum + app.amount, 0);

  return `💳 **Bulk Credit Application Confirmation**\n\n` +
         `I'm ready to apply credits for:\n` +
         `👤 **Customer:** ${customer.name} (${customer.id})\n` +
         `📋 **Invoices:** ${applications.length} invoices\n` +
         `💰 **Total Credits:** $${totalCredits}\n\n` +
         `This will apply credits to multiple invoices at once. Is this correct? Please confirm with "yes" or "no".`;
}

/**
 * Generate statement generation confirmation
 */
function generateStatementConfirmation(extractedInfo, confirmedData) {
  const { periodStart, periodEnd } = extractedInfo;
  const customer = confirmedData;

  return `📄 **Statement Generation Confirmation**\n\n` +
         `I'm ready to generate a statement for:\n` +
         `👤 **Customer:** ${customer.name} (${customer.id})\n` +
         `📅 **Period:** ${periodStart} to ${periodEnd}\n\n` +
         `This will create a detailed account statement. Is this correct? Please confirm with "yes" or "no".`;
}

/**
 * Generate generic confirmation
 */
function generateGenericConfirmation(extractedInfo, confirmedData) {
  const { intent } = extractedInfo;

  return `✅ **Confirmation Required**\n\n` +
         `I'm ready to process your request (${intent}).\n\n` +
         `Please confirm with "yes" to proceed or "no" to cancel.`;
}

/**
 * Generate success message after action completion
 * @param {string} actionType - Type of action completed
 * @param {Object} result - Result from action tool
 * @returns {string} - Success message
 */
function generateSuccessMessage(actionType, result) {
  switch (actionType) {
    case 'credit_application':
      return `✅ **Credits Applied Successfully!**\n\n` +
             `  Applied $${result.transaction.amount} to invoice ${result.transaction.invoiceId}\n` +
             `  New balance: $${result.invoice.newBalance}\n` +
             `  Status: ${result.invoice.status}`;
    
    case 'credits_added':
      return `✅ **Credits Added Successfully!**\n\n` +
             `  Added $${result.credit.amount} to ${result.customer.name}'s account\n` +
             `  Credit ID: ${result.credit.id}`;
    
    case 'credit_memo_created':
      return `✅ **Credit Memo Created Successfully!**\n\n` +
             `  Credit memo ${result.creditMemo.id} has been created\n` +
             `  Amount: $${result.creditMemo.amount}\n` +
             `  Status: Pending approval`;

    case 'payment_plan_created':
      return `✅ **Payment Plan Created Successfully!**\n\n` +
             `  Plan ID: ${result.paymentPlan.id}\n` +
             `  Monthly Payment: $${result.paymentPlan.monthlyAmount}\n` +
             `  Estimated Duration: ${result.paymentPlan.estimatedMonths} months\n` +
             `  Invoices Included: ${result.affectedInvoices.length}`;

    case 'bulk_credits_applied':
      return `✅ **Bulk Credits Applied Successfully!**\n\n` +
             `  Total Credits Applied: $${result.totalCreditsApplied}\n` +
             `  Invoices Processed: ${result.totalApplications}\n` +
             `  All applications completed successfully`;

    case 'statement_generated':
      return `✅ **Statement Generated Successfully!**\n\n` +
             `  Statement ID: ${result.statement.id}\n` +
             `  Total Invoiced: $${result.statement.summary.totalInvoiced}\n` +
             `  Total Credits: $${result.statement.summary.totalCredits}\n` +
             `  Net Amount: $${result.statement.summary.netAmount}`;

    default:
      return `✅ **Action completed successfully!**`;
  }
}

/**
 * Generate error message for failed actions
 * @param {string} actionType - Type of action that failed
 * @param {Object} error - Error details
 * @returns {string} - Error message
 */
function generateErrorMessage(actionType, error) {
  switch (error.type) {
    case 'not_found':
      return `❌ **Not Found**\n\n${error.error}`;
    
    case 'unauthorized':
      return `🚫 **Access Denied**\n\n${error.error}`;
    
    case 'insufficient_credits':
      return `💳 **Insufficient Credits**\n\n${error.error}`;
    
    case 'invalid_amount':
      return `💰 **Invalid Amount**\n\n${error.error}`;
    
    default:
      return `❌ **Error**\n\n${error.error || 'An unexpected error occurred.'}`;
  }
}

module.exports = {
  generateClarificationQuestion,
  generateConfirmationPrompt,
  generateSuccessMessage,
  generateErrorMessage
};
