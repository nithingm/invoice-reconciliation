/**
 * CREDIT HANDLER - Credit Application & Balance Operations
 * ========================================================
 * 
 * Handles all credit-related operations:
 * - Credit applications to invoices
 * - Credit balance inquiries
 * - Credit memo approvals
 */

const { applyCreditToInvoice, getCustomerCreditBalance, approveCreditMemo } = require('../services/pythonService');
const { formatCreditApplicationSuccess, formatCreditBalance, formatCreditMemoApproval, ERROR_MESSAGES } = require('../config/aiConfig');
const { validateCustomer, formatCustomerValidationError } = require('../services/validationService');
const database = require('../data/database');

/**
 * HANDLER: Credit Application
 * 
 * Processes requests to apply credits to customer invoices
 * Example: "I need to apply 500 credits to John Smith's invoice INV001"
 * 
 * Process:
 * 1. Validate customer and credit amount information
 * 2. Call Python microservice to process credit application
 * 3. Return formatted success/error response
 */
async function handleCreditApplication(extractedInfo) {
  try {
    console.log('💳 Processing credit application:', extractedInfo);

    // STEP 1: Validate customer exists
    const customerValidation = validateCustomer(extractedInfo.customerName, extractedInfo.customerId);

    if (!customerValidation.isValid) {
      return {
        message: formatCustomerValidationError(customerValidation),
        type: 'error'
      };
    }

    const customer = customerValidation.customer;
    console.log(`✅ Customer validated: ${customer.name} (${customer.id})`);

    // STEP 2: Validate credit amount
    if (!extractedInfo.creditAmount) {
      return {
        message: '🔴 Please specify the credit amount to apply. Example: "Apply $500 credit to John Smith"',
        type: 'error'
      };
    }

    // STEP 3: Call Python microservice for credit application processing
    const pythonResult = await applyCreditToInvoice(
      customer.id,                    // Use validated customer ID
      customer.name,                  // Use validated customer name
      extractedInfo.creditAmount,
      extractedInfo.invoiceId,
      {
        customers: database.customers,
        credits: database.credits,
        invoices: database.invoices
      }
    );

    console.log('🐍 Python result:', pythonResult);

    // Handle Python microservice errors
    if (pythonResult.error) {
      return {
        message: `🔴 System Error: ${pythonResult.error}`,
        type: 'error'
      };
    }

    // Handle validation failures
    if (!pythonResult.success) {
      const errors = pythonResult.validation_errors || [];
      return {
        message: `🔴 Credit Application Failed\n\n${errors.join('\n')}`,
        type: 'error'
      };
    }

    // Success - generate formatted response using template
    const transaction = pythonResult.transaction;
    const humanResponse = formatCreditApplicationSuccess(transaction);

    return {
      message: humanResponse,
      type: 'success'
    };

  } catch (error) {
    console.error('❌ Credit application error:', error);
    return {
      message: '🔴 An error occurred while processing the credit application. Please try again.',
      type: 'error'
    };
  }
}

/**
 * HANDLER: Credit Balance Inquiry
 * 
 * Processes requests to check customer credit balance
 * Example: "What's John Smith's credit balance?"
 * 
 * Process:
 * 1. Validate customer information
 * 2. Call Python microservice to get credit balance
 * 3. Return formatted balance information
 */
async function handleCreditBalanceInquiry(extractedInfo) {
  try {
    console.log('💰 Processing credit balance inquiry:', extractedInfo);

    // Validate required information
    if (!extractedInfo.customerName && !extractedInfo.customerId) {
      return {
        message: ERROR_MESSAGES.MISSING_CUSTOMER_INFO,
        type: 'error'
      };
    }

    // Call Python microservice for balance inquiry
    const pythonResult = await getCustomerCreditBalance(
      extractedInfo.customerId,
      extractedInfo.customerName,
      {
        customers: database.customers,
        credits: database.credits,
        invoices: database.invoices
      }
    );

    console.log('🐍 Python balance result:', pythonResult);

    if (pythonResult.error) {
      return {
        message: `🔴 Balance Inquiry Error: ${pythonResult.error}`,
        type: 'error'
      };
    }

    // Format and return balance information
    console.log('🔍 Formatting credit balance with:', {
      customer_info: pythonResult.customer_info,
      credit_info: pythonResult.credit_info
    });
    const responseMessage = formatCreditBalance(pythonResult.customer_info, pythonResult.credit_info);

    return {
      message: responseMessage,
      type: 'credit_balance'
    };

  } catch (error) {
    console.error('❌ Credit balance inquiry error:', error);
    return {
      message: '🔴 An error occurred while checking the credit balance. Please try again.',
      type: 'error'
    };
  }
}

/**
 * HANDLER: Credit Memo Approval
 * 
 * Processes customer responses to credit memo options
 * Example: "apply to account" or "apply to invoice"
 * 
 * Process:
 * 1. Validate customer choice and pending credit memo
 * 2. Call Python microservice to process approval
 * 3. Return formatted approval confirmation
 */
async function handleCreditMemoApproval(extractedInfo, conversationContext) {
  try {
    console.log('✅ Processing credit memo approval:', extractedInfo);
    console.log('✅ Conversation context:', conversationContext);

    const { customerChoice, targetInvoiceId } = extractedInfo;

    if (!customerChoice) {
      return {
        message: '🔴 Please specify your choice: "Apply to invoice", "Apply to account", or "Issue refund"',
        type: 'error'
      };
    }

    // Get the pending credit memo ID from conversation context
    const creditMemoId = conversationContext?.pendingCreditMemoId;
    
    if (!creditMemoId) {
      return {
        message: '🔴 No pending credit memo found. Please start with a quantity discrepancy or damage report first.',
        type: 'error'
      };
    }

    // Map customer choice to system action
    let choice = '';
    if (customerChoice.toLowerCase().includes('invoice')) {
      choice = 'apply_to_invoice';
    } else if (customerChoice.toLowerCase().includes('account')) {
      choice = 'apply_to_account';
    } else if (customerChoice.toLowerCase().includes('refund')) {
      choice = 'refund';
    } else {
      return {
        message: '🔴 Please specify a valid choice: "Apply to invoice", "Apply to account", or "Issue refund"',
        type: 'error'
      };
    }

    // Call Python microservice for credit memo approval
    const pythonResult = await approveCreditMemo(
      creditMemoId,
      choice,
      targetInvoiceId,
      {
        customers: database.customers,
        credits: database.credits,
        invoices: database.invoices
      }
    );

    console.log('🐍 Python approval result:', pythonResult);

    if (pythonResult.error) {
      return {
        message: `🔴 Credit Memo Approval Failed: ${pythonResult.error}`,
        type: 'error'
      };
    }

    // Format and return approval confirmation
    const { credit_memo } = pythonResult;
    const responseMessage = formatCreditMemoApproval(credit_memo, choice);

    return {
      message: responseMessage,
      type: 'credit_memo_approval',
      context: {
        pendingCreditMemoId: null  // Clear the pending credit memo after approval
      }
    };

  } catch (error) {
    console.error('❌ Credit memo approval error:', error);
    return {
      message: '🔴 An error occurred while processing the credit memo approval. Please try again.',
      type: 'error'
    };
  }
}

module.exports = {
  handleCreditApplication,
  handleCreditBalanceInquiry,
  handleCreditMemoApproval
};
