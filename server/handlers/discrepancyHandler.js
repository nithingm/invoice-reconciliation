/**
 * DISCREPANCY HANDLER - Quantity & Damage Report Operations
 * ==========================================================
 * 
 * Handles all discrepancy-related operations:
 * - Quantity discrepancy reports
 * - Damage reports
 * - Credit memo generation
 */

const { processQuantityDiscrepancy, processDamageReport } = require('../services/pythonService');
const { formatQuantityDiscrepancy, formatDamageReport, ERROR_MESSAGES } = require('../config/aiConfig');
const database = require('../data/database');

/**
 * HANDLER: Quantity Discrepancy
 * 
 * Processes reports of missing or incorrect quantities
 * Example: "Invoice INV001 billed 100 units but we received 95"
 * 
 * Process:
 * 1. Validate discrepancy information
 * 2. Call Python microservice to process discrepancy
 * 3. Generate credit memo and return options
 */
async function handleQuantityDiscrepancy(extractedInfo) {
  try {
    console.log('📦 Processing quantity discrepancy:', extractedInfo);

    // Validate required information
    if (!extractedInfo.invoiceId) {
      return {
        message: ERROR_MESSAGES.MISSING_INVOICE_INFO,
        type: 'error'
      };
    }

    if (!extractedInfo.missingQuantity) {
      return {
        message: '🔴 Please specify the missing quantity for the discrepancy report.',
        type: 'error'
      };
    }

    // Call Python microservice for quantity discrepancy processing
    const pythonResult = await processQuantityDiscrepancy(
      extractedInfo.customerId,
      extractedInfo.customerName,
      extractedInfo.invoiceId,
      extractedInfo.missingQuantity,
      extractedInfo.itemDescription
    );

    console.log('🐍 Python result:', pythonResult);

    if (pythonResult.error) {
      return {
        message: `🔴 System Error: ${pythonResult.error}`,
        type: 'error'
      };
    }

    if (!pythonResult.success) {
      return {
        message: `🔴 Quantity Discrepancy Processing Failed: ${pythonResult.error}`,
        type: 'error'
      };
    }

    // Format response and set context for credit memo approval
    const { customer_info, invoice_info, credit_memo } = pythonResult;
    const responseMessage = formatQuantityDiscrepancy(customer_info, invoice_info, credit_memo);

    return {
      message: responseMessage,
      type: 'quantity_discrepancy',
      context: {
        pendingCreditMemoId: credit_memo.id,
        customerId: customer_info.id,
        customerName: customer_info.name
      }
    };

  } catch (error) {
    console.error('❌ Quantity discrepancy error:', error);
    return {
      message: '🔴 An error occurred while processing the quantity discrepancy. Please try again.',
      type: 'error'
    };
  }
}

/**
 * HANDLER: Damage Report
 * 
 * Processes reports of damaged items
 * Example: "We received damaged transmission on invoice INV002"
 * 
 * Process:
 * 1. Validate damage report information
 * 2. Call Python microservice to process damage report
 * 3. Generate credit memo and return options
 */
async function handleDamageReport(extractedInfo) {
  try {
    console.log('💥 Processing damage report:', extractedInfo);

    // Validate required information
    if (!extractedInfo.invoiceId) {
      return {
        message: ERROR_MESSAGES.MISSING_INVOICE_INFO,
        type: 'error'
      };
    }

    if (!extractedInfo.damageDescription && !extractedInfo.itemDescription) {
      return {
        message: '🔴 Please describe the damaged item or provide damage details.',
        type: 'error'
      };
    }

    // Call Python microservice for damage report processing
    const pythonResult = await processDamageReport(
      extractedInfo.customerId,
      extractedInfo.customerName,
      extractedInfo.invoiceId,
      extractedInfo.damageDescription || extractedInfo.itemDescription
    );

    console.log('🐍 Python result:', pythonResult);

    if (pythonResult.error) {
      return {
        message: `🔴 System Error: ${pythonResult.error}`,
        type: 'error'
      };
    }

    if (!pythonResult.success) {
      return {
        message: `🔴 Damage Report Processing Failed: ${pythonResult.error}`,
        type: 'error'
      };
    }

    // Format response and set context for credit memo approval
    const { customer_info, invoice_info, damage_report, credit_memo } = pythonResult;
    const responseMessage = formatDamageReport(customer_info, invoice_info, damage_report, credit_memo);

    return {
      message: responseMessage,
      type: 'damage_report',
      context: {
        pendingCreditMemoId: credit_memo.id,
        customerId: customer_info.id,
        customerName: customer_info.name
      }
    };

  } catch (error) {
    console.error('❌ Damage report error:', error);
    return {
      message: '🔴 An error occurred while processing the damage report. Please try again.',
      type: 'error'
    };
  }
}

module.exports = {
  handleQuantityDiscrepancy,
  handleDamageReport
};
