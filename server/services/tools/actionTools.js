/**
 * ACTION TOOLS - Write/Modify Database Operations
 * ==============================================
 * 
 * These are sensitive functions that change data in the database.
 * The agent should NEVER call these without explicit user confirmation.
 * 
 * All functions return standardized result objects with success/error status.
 */

const Customer = require('../../models/Customer');
const Credit = require('../../models/Credit');
const Invoice = require('../../models/Invoice');
const { v4: uuidv4 } = require('uuid');

/**
 * Apply credits to an invoice
 * @param {string} invoiceId - Invoice ID to apply credits to
 * @param {number} creditAmount - Amount of credits to apply
 * @param {string} customerId - Customer ID for validation
 * @returns {Object} - Operation result
 */
async function applyCreditsToInvoice(invoiceId, creditAmount, customerId) {
  try {
    console.log(`💳 Applying $${creditAmount} credits to invoice ${invoiceId}`);

    // Find the invoice
    const invoice = await Invoice.findOne({ id: invoiceId });
    if (!invoice) {
      return {
        success: false,
        error: `Invoice ${invoiceId} not found`,
        type: 'not_found'
      };
    }

    // Validate customer ownership
    if (invoice.customerId !== customerId) {
      return {
        success: false,
        error: `Invoice ${invoiceId} does not belong to customer ${customerId}`,
        type: 'unauthorized'
      };
    }

    // Check available credits
    const customerCredits = await Credit.find({
      customerId: customerId,
      status: { $in: ['active', 'partially_used'] },
      amount: { $gt: 0 },
      expiryDate: { $gt: new Date() }
    });

    const totalAvailableCredits = customerCredits.reduce((sum, credit) => sum + credit.amount, 0);

    if (totalAvailableCredits < creditAmount) {
      return {
        success: false,
        error: `Insufficient credits. Available: $${totalAvailableCredits}, Requested: $${creditAmount}`,
        type: 'insufficient_credits'
      };
    }

    // Calculate new balance
    const currentBalance = invoice.currentAmount;
    const previousBalance = currentBalance;
    const newBalance = Math.max(0, currentBalance - creditAmount);

    // Update invoice
    invoice.currentAmount = newBalance;
    invoice.creditsApplied = (invoice.creditsApplied || 0) + creditAmount;
    invoice.status = newBalance === 0 ? 'paid' : 'pending';
    invoice.paymentStatus = newBalance === 0 ? 'paid' : 'partial';
    await invoice.save();

    // Deduct credits (use credits in order)
    let remainingCreditToApply = creditAmount;
    const usedCredits = [];

    for (const credit of customerCredits) {
      if (remainingCreditToApply <= 0) break;

      const creditToUse = Math.min(credit.amount, remainingCreditToApply);
      credit.amount -= creditToUse;

      if (credit.amount === 0) {
        credit.status = 'used';
      } else {
        credit.status = 'partially_used';
      }

      await credit.save();

      usedCredits.push({
        id: credit.id,
        amountUsed: creditToUse
      });

      remainingCreditToApply -= creditToUse;
    }

    console.log(`✅ Successfully applied $${creditAmount} credits to invoice ${invoiceId}`);

    return {
      success: true,
      transaction: {
        id: `TXN-${Date.now()}`,
        type: 'credit_application',
        invoiceId,
        customerId,
        amount: creditAmount,
        timestamp: new Date().toISOString(),
        usedCredits
      },
      invoice: {
        id: invoice.id,
        previousBalance,
        newBalance,
        status: invoice.status
      },
      creditsUsed: usedCredits,
      type: 'credit_application'
    };

  } catch (error) {
    console.error('❌ Error applying credits to invoice:', error);
    return {
      success: false,
      error: `Failed to apply credits: ${error.message}`,
      type: 'system_error'
    };
  }
}

/**
 * Create a new credit memo
 * @param {Object} creditMemoData - Credit memo information
 * @returns {Object} - Operation result
 */
async function createCreditMemo(creditMemoData) {
  try {
    const { customerId, amount, reason, invoiceId, itemDescription } = creditMemoData;
    
    console.log(`📝 Creating credit memo for customer ${customerId}, amount: $${amount}`);
    
    // Validate customer exists
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      return {
        success: false,
        error: `Customer ${customerId} not found`,
        type: 'not_found'
      };
    }
    
    // Create credit memo
    const creditMemo = {
      id: `CREDIT-${Date.now()}`,
      customerId,
      amount,
      reason,
      invoiceId,
      itemDescription,
      status: 'pending',
      createdDate: new Date().toISOString(),
      approvedDate: null,
      approvedBy: null
    };
    
    // Add to credits database (pending approval)
    credits.push({
      id: creditMemo.id,
      customerId,
      amount,
      source: 'credit_memo',
      status: 'pending',
      date: creditMemo.createdDate,
      relatedInvoice: invoiceId,
      description: reason
    });
    
    console.log(`✅ Created credit memo ${creditMemo.id}`);
    
    return {
      success: true,
      creditMemo,
      type: 'credit_memo_created'
    };
    
  } catch (error) {
    console.error('❌ Error creating credit memo:', error);
    return {
      success: false,
      error: `Failed to create credit memo: ${error.message}`,
      type: 'system_error'
    };
  }
}

/**
 * Update invoice status
 * @param {string} invoiceId - Invoice ID
 * @param {string} newStatus - New status
 * @param {string} customerId - Customer ID for validation
 * @returns {Object} - Operation result
 */
async function updateInvoiceStatus(invoiceId, newStatus, customerId) {
  try {
    console.log(`📋 Updating invoice ${invoiceId} status to: ${newStatus}`);
    
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      return {
        success: false,
        error: `Invoice ${invoiceId} not found`,
        type: 'not_found'
      };
    }
    
    // Validate customer ownership
    if (invoice.customerId !== customerId) {
      return {
        success: false,
        error: `Invoice ${invoiceId} does not belong to customer ${customerId}`,
        type: 'unauthorized'
      };
    }
    
    const previousStatus = invoice.status;
    invoice.status = newStatus;
    invoice.lastUpdated = new Date().toISOString();
    
    console.log(`✅ Updated invoice ${invoiceId} status: ${previousStatus} → ${newStatus}`);
    
    return {
      success: true,
      invoice: {
        id: invoice.id,
        previousStatus,
        newStatus,
        lastUpdated: invoice.lastUpdated
      },
      type: 'status_update'
    };
    
  } catch (error) {
    console.error('❌ Error updating invoice status:', error);
    return {
      success: false,
      error: `Failed to update invoice status: ${error.message}`,
      type: 'system_error'
    };
  }
}

/**
 * Add credits to customer account
 * @param {string} customerId - Customer ID
 * @param {number} amount - Credit amount to add
 * @param {string} source - Source of the credits
 * @param {string} description - Description of the credit
 * @returns {Object} - Operation result
 */
async function addCreditsToCustomer(customerId, amount, source = 'manual', description = '') {
  try {
    console.log(`💰 Adding $${amount} credits to customer ${customerId}`);

    // Validate customer exists
    const customer = await Customer.findOne({ id: customerId });
    if (!customer) {
      return {
        success: false,
        error: `Customer ${customerId} not found`,
        type: 'not_found'
      };
    }

    // Create new credit entry
    const newCredit = new Credit({
      id: `CREDIT-${Date.now()}-${uuidv4().slice(0, 8)}`,
      customerId,
      customerName: customer.name,
      amount,
      originalAmount: amount,
      status: 'active',
      earnedDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      sourceType: 'promotional',
      description: description || 'Manual credit addition via AI assistant',
      category: 'promotional'
    });

    await newCredit.save();

    console.log(`✅ Added $${amount} credits to ${customer.name} (${customerId})`);

    return {
      success: true,
      credit: {
        id: newCredit.id,
        amount: newCredit.amount,
        date: newCredit.earnedDate
      },
      customer: {
        id: customer.id,
        name: customer.name
      },
      type: 'credits_added'
    };

  } catch (error) {
    console.error('❌ Error adding credits to customer:', error);
    return {
      success: false,
      error: `Failed to add credits: ${error.message}`,
      type: 'system_error'
    };
  }
}

/**
 * Process partial payment
 * @param {string} invoiceId - Invoice ID
 * @param {number} paymentAmount - Payment amount
 * @param {string} customerId - Customer ID for validation
 * @returns {Object} - Operation result
 */
async function processPartialPayment(invoiceId, paymentAmount, customerId) {
  try {
    console.log(`💵 Processing $${paymentAmount} partial payment for invoice ${invoiceId}`);
    
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      return {
        success: false,
        error: `Invoice ${invoiceId} not found`,
        type: 'not_found'
      };
    }
    
    // Validate customer ownership
    if (invoice.customerId !== customerId) {
      return {
        success: false,
        error: `Invoice ${invoiceId} does not belong to customer ${customerId}`,
        type: 'unauthorized'
      };
    }
    
    const currentBalance = invoice.remainingBalance || invoice.amount;
    
    if (paymentAmount > currentBalance) {
      return {
        success: false,
        error: `Payment amount ($${paymentAmount}) exceeds remaining balance ($${currentBalance})`,
        type: 'invalid_amount'
      };
    }
    
    // Process payment
    const newBalance = currentBalance - paymentAmount;
    invoice.remainingBalance = newBalance;
    
    if (newBalance === 0) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'partial';
    }
    
    invoice.lastPaymentDate = new Date().toISOString();
    
    console.log(`✅ Processed $${paymentAmount} payment for invoice ${invoiceId}`);
    
    return {
      success: true,
      payment: {
        invoiceId,
        amount: paymentAmount,
        previousBalance: currentBalance,
        newBalance,
        status: invoice.status,
        paymentDate: invoice.lastPaymentDate
      },
      type: 'partial_payment'
    };
    
  } catch (error) {
    console.error('❌ Error processing partial payment:', error);
    return {
      success: false,
      error: `Failed to process payment: ${error.message}`,
      type: 'system_error'
    };
  }
}

/**
 * Create payment plan for overdue invoices
 * @param {string} customerId - Customer ID
 * @param {Array} invoiceIds - Array of invoice IDs to include in plan
 * @param {Object} planDetails - Payment plan details
 * @returns {Object} - Operation result
 */
async function createPaymentPlan(customerId, invoiceIds, planDetails) {
  try {
    const { monthlyAmount, startDate, description } = planDetails;

    console.log(`📅 Creating payment plan for customer ${customerId}`);

    // Validate customer
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      return {
        success: false,
        error: `Customer ${customerId} not found`,
        type: 'not_found'
      };
    }

    // Validate invoices
    const planInvoices = invoices.filter(inv =>
      invoiceIds.includes(inv.id) && inv.customerId === customerId
    );

    if (planInvoices.length !== invoiceIds.length) {
      return {
        success: false,
        error: 'Some invoices not found or do not belong to customer',
        type: 'invalid_invoices'
      };
    }

    const totalAmount = planInvoices.reduce((sum, inv) =>
      sum + (inv.remainingBalance || inv.amount), 0
    );

    const estimatedMonths = Math.ceil(totalAmount / monthlyAmount);

    // Create payment plan record
    const paymentPlan = {
      id: `PLAN-${Date.now()}`,
      customerId,
      invoiceIds,
      totalAmount,
      monthlyAmount,
      estimatedMonths,
      startDate,
      description,
      status: 'active',
      createdDate: new Date().toISOString(),
      nextPaymentDue: startDate,
      paymentsReceived: 0
    };

    // Update invoice statuses
    planInvoices.forEach(invoice => {
      invoice.status = 'payment_plan';
      invoice.paymentPlanId = paymentPlan.id;
    });

    console.log(`✅ Created payment plan ${paymentPlan.id} for ${estimatedMonths} months`);

    return {
      success: true,
      paymentPlan,
      affectedInvoices: planInvoices.map(inv => ({
        id: inv.id,
        amount: inv.remainingBalance || inv.amount
      })),
      type: 'payment_plan_created'
    };

  } catch (error) {
    console.error('❌ Error creating payment plan:', error);
    return {
      success: false,
      error: `Failed to create payment plan: ${error.message}`,
      type: 'system_error'
    };
  }
}

/**
 * Bulk credit application to multiple invoices
 * @param {string} customerId - Customer ID
 * @param {Array} applications - Array of {invoiceId, amount} objects
 * @returns {Object} - Operation result
 */
async function bulkApplyCredits(customerId, applications) {
  try {
    console.log(`💳 Bulk applying credits for customer ${customerId}`);

    // Validate customer
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      return {
        success: false,
        error: `Customer ${customerId} not found`,
        type: 'not_found'
      };
    }

    // Calculate total credits needed
    const totalCreditsNeeded = applications.reduce((sum, app) => sum + app.amount, 0);

    // Check available credits
    const customerCredits = credits.filter(credit =>
      credit.customerId === customerId && credit.status === 'available'
    );

    const totalAvailableCredits = customerCredits.reduce((sum, credit) => sum + credit.amount, 0);

    if (totalAvailableCredits < totalCreditsNeeded) {
      return {
        success: false,
        error: `Insufficient credits. Available: $${totalAvailableCredits}, Needed: $${totalCreditsNeeded}`,
        type: 'insufficient_credits'
      };
    }

    // Process each application
    const results = [];
    let remainingCredits = [...customerCredits];

    for (const application of applications) {
      const result = await applySingleCredit(
        application.invoiceId,
        application.amount,
        customerId,
        remainingCredits
      );

      if (!result.success) {
        return result; // Return first error
      }

      results.push(result);
      remainingCredits = result.remainingCredits;
    }

    console.log(`✅ Bulk credit application completed: ${applications.length} invoices processed`);

    return {
      success: true,
      totalApplications: applications.length,
      totalCreditsApplied: totalCreditsNeeded,
      applications: results,
      type: 'bulk_credits_applied'
    };

  } catch (error) {
    console.error('❌ Error in bulk credit application:', error);
    return {
      success: false,
      error: `Failed to apply bulk credits: ${error.message}`,
      type: 'system_error'
    };
  }
}

/**
 * Helper function for single credit application
 */
async function applySingleCredit(invoiceId, creditAmount, customerId, availableCredits) {
  const invoice = invoices.find(inv => inv.id === invoiceId);
  if (!invoice || invoice.customerId !== customerId) {
    return {
      success: false,
      error: `Invalid invoice: ${invoiceId}`,
      type: 'invalid_invoice'
    };
  }

  // Apply credits logic (similar to applyCreditsToInvoice but with provided credits)
  const remainingBalance = (invoice.remainingBalance || invoice.amount) - creditAmount;
  invoice.remainingBalance = Math.max(0, remainingBalance);
  invoice.status = invoice.remainingBalance === 0 ? 'paid' : 'partial';

  // Deduct from available credits
  let remainingCreditToApply = creditAmount;
  const usedCredits = [];

  for (const credit of availableCredits) {
    if (remainingCreditToApply <= 0) break;

    const creditToUse = Math.min(credit.amount, remainingCreditToApply);
    credit.amount -= creditToUse;

    if (credit.amount === 0) {
      credit.status = 'used';
    }

    usedCredits.push({
      id: credit.id,
      amountUsed: creditToUse
    });

    remainingCreditToApply -= creditToUse;
  }

  return {
    success: true,
    invoiceId,
    creditAmount,
    newBalance: invoice.remainingBalance,
    usedCredits,
    remainingCredits: availableCredits
  };
}

/**
 * Generate customer statement with detailed breakdown
 * @param {string} customerId - Customer ID
 * @param {string} periodStart - Start date (YYYY-MM-DD)
 * @param {string} periodEnd - End date (YYYY-MM-DD)
 * @returns {Object} - Statement data
 */
async function generateCustomerStatement(customerId, periodStart, periodEnd) {
  try {
    console.log(`📄 Generating statement for customer ${customerId} (${periodStart} to ${periodEnd})`);

    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      return {
        success: false,
        error: `Customer ${customerId} not found`,
        type: 'not_found'
      };
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    // Get invoices in period
    const periodInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoice.customerId === customerId &&
             invoiceDate >= startDate &&
             invoiceDate <= endDate;
    });

    // Get credits in period
    const periodCredits = credits.filter(credit => {
      const creditDate = new Date(credit.date);
      return credit.customerId === customerId &&
             creditDate >= startDate &&
             creditDate <= endDate;
    });

    // Calculate totals
    const totalInvoiced = periodInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCredits = periodCredits.reduce((sum, credit) => sum + credit.amount, 0);
    const totalPaid = periodInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const totalOutstanding = periodInvoices.filter(inv => ['pending', 'partial'].includes(inv.status)).reduce((sum, inv) => sum + (inv.remainingBalance || inv.amount), 0);

    const statement = {
      id: `STMT-${Date.now()}`,
      customerId,
      customerName: customer.name,
      customerCompany: customer.company,
      periodStart,
      periodEnd,
      generatedDate: new Date().toISOString(),
      summary: {
        totalInvoiced,
        totalCredits,
        totalPaid,
        totalOutstanding,
        netAmount: totalInvoiced - totalCredits
      },
      invoices: periodInvoices.map(inv => ({
        id: inv.id,
        date: inv.date,
        amount: inv.amount,
        status: inv.status,
        remainingBalance: inv.remainingBalance || 0
      })),
      credits: periodCredits.map(credit => ({
        id: credit.id,
        date: credit.date,
        amount: credit.amount,
        source: credit.source,
        description: credit.description
      }))
    };

    console.log(`✅ Generated statement ${statement.id} with ${periodInvoices.length} invoices and ${periodCredits.length} credits`);

    return {
      success: true,
      statement,
      type: 'statement_generated'
    };

  } catch (error) {
    console.error('❌ Error generating statement:', error);
    return {
      success: false,
      error: `Failed to generate statement: ${error.message}`,
      type: 'system_error'
    };
  }
}

module.exports = {
  applyCreditsToInvoice,
  createCreditMemo,
  updateInvoiceStatus,
  addCreditsToCustomer,
  processPartialPayment,
  createPaymentPlan,
  bulkApplyCredits,
  generateCustomerStatement
};
