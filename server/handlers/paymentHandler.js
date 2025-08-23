/**
 * PAYMENT HANDLER - Partial Payment Operations
 * ============================================
 * 
 * Handles all payment-related operations:
 * - Partial payment processing with credit deduction
 * - Payment validation and credit application
 */

const { processPartialPayment } = require('../services/pythonService');
const { formatPartialPaymentResult, ERROR_MESSAGES } = require('../config/aiConfig');
const { validateCustomer, validateInvoiceOwnership, formatCustomerValidationError } = require('../services/validationService');
const database = require('../data/database');

/**
 * HANDLER: Partial Payment Processing
 * 
 * Processes partial payments and attempts to cover remaining balance with credits
 * Example: "John Smith paid $4000 for invoice INV008 but total was $5000"
 * 
 * Process:
 * 1. Validate payment information
 * 2. Call Python microservice to process partial payment
 * 3. Apply available credits to cover remaining balance
 * 4. Return payment processing results
 */
async function handlePartialPayment(extractedInfo) {
  try {
    console.log('🔄 Processing partial payment:', extractedInfo);

    // STEP 1: Validate customer exists
    const customerValidation = await validateCustomer(extractedInfo.customerName, extractedInfo.customerId);

    if (!customerValidation.isValid) {
      return {
        message: formatCustomerValidationError(customerValidation),
        type: 'error'
      };
    }

    const customer = customerValidation.customer;
    console.log(`✅ Customer validated: ${customer.name} (${customer.id})`);

    // STEP 2: Validate required payment information
    if (!extractedInfo.invoiceId) {
      return {
        message: ERROR_MESSAGES.MISSING_INVOICE_INFO,
        type: 'error'
      };
    }

    if (!extractedInfo.paidAmount) {
      return {
        message: ERROR_MESSAGES.MISSING_PAYMENT_INFO,
        type: 'error'
      };
    }

    // STEP 3: Validate invoice ownership
    const invoiceValidation = await validateInvoiceOwnership(extractedInfo.invoiceId, customer.id);

    if (!invoiceValidation.isValid) {
      let errorMessage = invoiceValidation.message;

      if (invoiceValidation.actualOwner) {
        errorMessage += `\n\n📄 **Invoice ${extractedInfo.invoiceId} Details:**\n`;
        errorMessage += `• Actual Owner: ${invoiceValidation.actualOwner.name} (${invoiceValidation.actualOwner.id})\n`;
        errorMessage += `• Company: ${invoiceValidation.actualOwner.company}`;
      }

      return {
        message: errorMessage,
        type: 'error'
      };
    }

    console.log(`✅ Invoice ownership validated: ${extractedInfo.invoiceId} belongs to ${customer.name}`);

    // STEP 4: Call Python microservice for partial payment processing
    const pythonResult = await processPartialPayment(
      customer.id,                    // Use validated customer ID
      customer.name,                  // Use validated customer name
      extractedInfo.invoiceId,
      extractedInfo.paidAmount,
      extractedInfo.invoiceAmount
    );

    console.log('🐍 Python partial payment result:', pythonResult);

    if (pythonResult.error) {
      return {
        message: `🔴 Partial Payment Processing Error: ${pythonResult.error}`,
        type: 'error'
      };
    }

    // Format and return payment processing results
    const responseMessage = formatPartialPaymentResult(pythonResult);

    return {
      message: responseMessage,
      type: 'partial_payment'
    };

  } catch (error) {
    console.error('❌ Partial payment processing error:', error);
    return {
      message: '🔴 An error occurred while processing the partial payment. Please try again.',
      type: 'error'
    };
  }
}

module.exports = {
  handlePartialPayment
};
