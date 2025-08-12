/**
 * INVOICE HANDLER - Invoice & Purchase History Operations
 * =======================================================
 * 
 * Handles all invoice-related operations:
 * - Invoice detail inquiries
 * - Purchase history requests
 */

const { getCustomerPurchaseHistory } = require('../services/pythonService');
const { formatPurchaseHistory, ERROR_MESSAGES } = require('../config/aiConfig');
const database = require('../data/database');

/**
 * HANDLER: Invoice Inquiry
 * 
 * Processes requests for specific invoice details
 * Example: "Show me details for invoice INV001"
 * 
 * Process:
 * 1. Validate invoice ID
 * 2. Find invoice in database
 * 3. Return formatted invoice details
 */
async function handleInvoiceInquiry(extractedInfo) {
  try {
    console.log('📄 Processing invoice inquiry:', extractedInfo);

    if (!extractedInfo.invoiceId) {
      return {
        message: ERROR_MESSAGES.MISSING_INVOICE_INFO,
        type: 'error'
      };
    }

    // Find the invoice in the database
    const invoice = database.invoices.find(inv => 
      inv.id.toLowerCase() === extractedInfo.invoiceId.toLowerCase()
    );

    if (!invoice) {
      return {
        message: ERROR_MESSAGES.INVOICE_NOT_FOUND,
        type: 'error'
      };
    }

    // Find the customer associated with this invoice
    const customer = database.customers.find(cust => cust.id === invoice.customerId);
    
    if (!customer) {
      return {
        message: ERROR_MESSAGES.CUSTOMER_NOT_FOUND,
        type: 'error'
      };
    }

    // Calculate customer's available credits
    const activeCredits = database.getCustomerActiveCredits(customer.id);
    const totalAvailableCredits = database.getCustomerTotalActiveCredits(customer.id);

    return {
      message: `📄 **Invoice Details**\n\n` +
               `**Invoice ID:** ${invoice.id}\n` +
               `**Customer:** ${customer.name} (${customer.id})\n` +
               `**Date:** ${invoice.date}\n` +
               `**Due Date:** ${invoice.dueDate}\n` +
               `**Original Amount:** $${invoice.originalAmount.toFixed(2)}\n` +
               `**Current Amount:** $${invoice.currentAmount.toFixed(2)}\n` +
               `**Status:** ${invoice.status}\n` +
               `**Payment Status:** ${invoice.paymentStatus}\n\n` +
               `**Description:** ${invoice.description}\n\n` +
               `**Items:**\n${invoice.items.map(item => 
                 `• ${item.description} (${item.partNumber})\n  Qty: ${item.quantity} × $${item.unitPrice.toFixed(2)} = $${item.totalPrice.toFixed(2)}`
               ).join('\n')}\n\n` +
               `**Taxes:** $${invoice.taxes.salesTax.toFixed(2)} (${invoice.taxes.taxRate}%)\n` +
               `**Shipping:** $${invoice.shipping.cost.toFixed(2)} (${invoice.shipping.method})\n\n` +
               `**Customer Available Credits:** $${totalAvailableCredits.toFixed(2)}`,
      type: 'invoice_details'
    };

  } catch (error) {
    console.error('❌ Invoice inquiry error:', error);
    return {
      message: '🔴 An error occurred while retrieving invoice details. Please try again.',
      type: 'error'
    };
  }
}

/**
 * HANDLER: Purchase History Inquiry
 * 
 * Processes requests for customer purchase history
 * Example: "Show me John Smith's purchase history"
 * 
 * Process:
 * 1. Validate customer information
 * 2. Call Python microservice to compile purchase history
 * 3. Return formatted purchase history
 */
async function handlePurchaseHistoryInquiry(extractedInfo) {
  try {
    console.log('📊 Processing purchase history inquiry:', extractedInfo);

    // Validate required information
    if (!extractedInfo.customerName && !extractedInfo.customerId) {
      return {
        message: ERROR_MESSAGES.MISSING_CUSTOMER_INFO,
        type: 'error'
      };
    }

    // Call Python microservice for purchase history
    const pythonResult = await getCustomerPurchaseHistory(
      extractedInfo.customerId,
      extractedInfo.customerName,
      {
        customers: database.customers,
        credits: database.credits,
        invoices: database.invoices
      }
    );

    console.log('🐍 Python purchase history result:', pythonResult);

    if (pythonResult.error) {
      return {
        message: `🔴 Purchase History Error: ${pythonResult.error}`,
        type: 'error'
      };
    }

    // Format and return purchase history
    const responseMessage = formatPurchaseHistory(pythonResult.customer_info, pythonResult.purchase_history);

    return {
      message: responseMessage,
      type: 'purchase_history'
    };

  } catch (error) {
    console.error('❌ Purchase history inquiry error:', error);
    return {
      message: '🔴 An error occurred while retrieving purchase history. Please try again.',
      type: 'error'
    };
  }
}

module.exports = {
  handleInvoiceInquiry,
  handlePurchaseHistoryInquiry
};
