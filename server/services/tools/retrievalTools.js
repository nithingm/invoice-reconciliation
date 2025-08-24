/**
 * RETRIEVAL TOOLS - Read-Only Database Operations
 * ===============================================
 * 
 * These are safe functions that only fetch data from the database.
 * The agent can call these freely without user confirmation.
 * 
 * All functions return standardized data structures for the agent to process.
 */

const Customer = require('../../models/Customer');
const Credit = require('../../models/Credit');
const Invoice = require('../../models/Invoice');

/**
 * Find customers by name (handles partial matches and ambiguity)
 * @param {string} name - Customer name to search for
 * @returns {Array} - Array of matching customers
 */
async function findCustomerByName(name) {
  try {
    console.log(`🔍 Searching for customer: "${name}"`);

    const searchTerm = name.toLowerCase().trim();

    // Search in MongoDB customers collection
    const matches = await Customer.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { company: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: new RegExp(searchTerm.split(' ').join('.*'), 'i') } }
      ]
    });

    console.log(`✅ Found ${matches.length} customer matches for "${name}"`);

    // Return standardized customer objects
    return matches.map(customer => ({
      id: customer.id,
      name: customer.name,
      company: customer.company,
      email: customer.email,
      type: 'customer'
    }));

  } catch (error) {
    console.error('❌ Error finding customer by name:', error);
    throw new Error(`Failed to search for customer: ${error.message}`);
  }
}

/**
 * Find invoice by ID
 * @param {string} invoiceId - Invoice ID to search for
 * @returns {Object|null} - Invoice object or null if not found
 */
async function findInvoiceById(invoiceId) {
  try {
    console.log(`🔍 Searching for invoice: "${invoiceId}"`);

    const invoice = await Invoice.findOne({
      id: { $regex: new RegExp(`^${invoiceId}$`, 'i') }
    });

    if (!invoice) {
      console.log(`❌ Invoice not found: ${invoiceId}`);
      return null;
    }

    console.log(`✅ Found invoice: ${invoice.id}`);

    // Return standardized invoice object
    return {
      id: invoice.id,
      customerId: invoice.customerId,
      amount: invoice.amount,
      status: invoice.status,
      date: invoice.date,
      items: invoice.items,
      type: 'invoice'
    };

  } catch (error) {
    console.error('❌ Error finding invoice by ID:', error);
    throw new Error(`Failed to find invoice: ${error.message}`);
  }
}

/**
 * Get pending invoices for a customer
 * @param {string} customerId - Customer ID
 * @returns {Array} - Array of pending invoices
 */
async function getPendingInvoices(customerId) {
  try {
    console.log(`🔍 Getting pending invoices for customer: ${customerId}`);

    const pendingInvoices = await Invoice.find({
      customerId: customerId,
      status: { $in: ['pending', 'partial'] }
    });

    console.log(`✅ Found ${pendingInvoices.length} pending invoices`);

    return pendingInvoices.map(invoice => ({
      id: invoice.id,
      amount: invoice.originalAmount,
      status: invoice.status,
      date: invoice.date,
      remainingBalance: invoice.currentAmount,
      type: 'invoice'
    }));

  } catch (error) {
    console.error('❌ Error getting pending invoices:', error);
    throw new Error(`Failed to get pending invoices: ${error.message}`);
  }
}

/**
 * Get available credits for a customer
 * @param {string} customerId - Customer ID
 * @returns {Object} - Credit information
 */
async function getAvailableCredits(customerId) {
  try {
    console.log(`🔍 Getting available credits for customer: ${customerId}`);

    const customerCredits = await Credit.find({
      customerId: customerId,
      status: { $in: ['active', 'partially_used'] },
      amount: { $gt: 0 },
      expiryDate: { $gt: new Date() } // Only non-expired credits
    });

    const totalCredits = customerCredits.reduce((sum, credit) => sum + credit.amount, 0);

    console.log(`✅ Found ${customerCredits.length} credits totaling $${totalCredits}`);

    return {
      customerId,
      totalAmount: totalCredits,
      creditCount: customerCredits.length,
      credits: customerCredits.map(credit => ({
        id: credit.id,
        amount: credit.amount,
        originalAmount: credit.originalAmount,
        source: credit.sourceType || 'Manual',
        description: credit.description,
        earnedDate: credit.earnedDate,
        expiryDate: credit.expiryDate,
        status: credit.status
      })),
      type: 'credits'
    };

  } catch (error) {
    console.error('❌ Error getting available credits:', error);
    throw new Error(`Failed to get available credits: ${error.message}`);
  }
}

/**
 * Find invoices by customer name (combines customer search + invoice lookup)
 * @param {string} customerName - Customer name
 * @returns {Object} - Customer and their invoices
 */
async function findInvoicesByCustomerName(customerName) {
  try {
    console.log(`🔍 Finding invoices for customer: "${customerName}"`);
    
    // First find the customer
    const foundCustomers = await findCustomerByName(customerName);
    
    if (foundCustomers.length === 0) {
      return { customers: [], invoices: [] };
    }

    if (foundCustomers.length > 1) {
      // Return multiple customers for clarification
      return { customers: foundCustomers, invoices: [], ambiguous: true };
    }

    // Single customer found, get their invoices
    const customer = foundCustomers[0];
    const customerInvoices = invoices.filter(invoice =>
      invoice.customerId === customer.id
    );
    
    console.log(`✅ Found ${customerInvoices.length} invoices for ${customer.name}`);
    
    return {
      customers: [customer],
      invoices: customerInvoices.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount,
        status: invoice.status,
        date: invoice.date,
        type: 'invoice'
      })),
      ambiguous: false
    };
    
  } catch (error) {
    console.error('❌ Error finding invoices by customer name:', error);
    throw new Error(`Failed to find invoices: ${error.message}`);
  }
}

/**
 * Search for any entity by text (universal search)
 * @param {string} searchText - Text to search for
 * @returns {Object} - Search results across all entities
 */
async function universalSearch(searchText) {
  try {
    console.log(`🔍 Universal search for: "${searchText}"`);
    
    const results = {
      customers: await findCustomerByName(searchText),
      invoices: [],
      credits: []
    };
    
    // Search invoices by ID
    if (searchText.toUpperCase().startsWith('INV')) {
      const invoice = await findInvoiceById(searchText);
      if (invoice) results.invoices.push(invoice);
    }
    
    // Search credits by ID
    if (searchText.toUpperCase().startsWith('CREDIT')) {
      const credit = credits.find(c =>
        c.id.toLowerCase() === searchText.toLowerCase()
      );
      if (credit) results.credits.push(credit);
    }
    
    const totalResults = results.customers.length + results.invoices.length + results.credits.length;
    console.log(`✅ Universal search found ${totalResults} total results`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Error in universal search:', error);
    throw new Error(`Search failed: ${error.message}`);
  }
}

/**
 * Get customer payment history with analytics
 * @param {string} customerId - Customer ID
 * @param {number} months - Number of months to look back (default: 12)
 * @returns {Object} - Payment history with analytics
 */
async function getCustomerPaymentHistory(customerId, months = 12) {
  try {
    console.log(`📊 Getting payment history for customer: ${customerId} (${months} months)`);

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    const customerInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoice.customerId === customerId && invoiceDate >= cutoffDate;
    });

    // Calculate analytics
    const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = customerInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const totalPending = customerInvoices.filter(inv => ['pending', 'partial'].includes(inv.status)).reduce((sum, inv) => sum + (inv.remainingBalance || inv.amount), 0);

    const paymentTrend = calculatePaymentTrend(customerInvoices);

    return {
      customerId,
      period: `${months} months`,
      totalInvoices: customerInvoices.length,
      totalInvoiced,
      totalPaid,
      totalPending,
      paymentRate: totalInvoiced > 0 ? (totalPaid / totalInvoiced * 100).toFixed(1) : 0,
      averageInvoiceAmount: customerInvoices.length > 0 ? (totalInvoiced / customerInvoices.length).toFixed(2) : 0,
      paymentTrend,
      invoices: customerInvoices.map(inv => ({
        id: inv.id,
        amount: inv.amount,
        status: inv.status,
        date: inv.date,
        remainingBalance: inv.remainingBalance || 0
      })),
      type: 'payment_history'
    };

  } catch (error) {
    console.error('❌ Error getting payment history:', error);
    throw new Error(`Failed to get payment history: ${error.message}`);
  }
}

/**
 * Calculate payment trend (improving, declining, stable)
 */
function calculatePaymentTrend(invoices) {
  if (invoices.length < 3) return 'insufficient_data';

  const sortedInvoices = invoices.sort((a, b) => new Date(a.date) - new Date(b.date));
  const recentInvoices = sortedInvoices.slice(-3);
  const olderInvoices = sortedInvoices.slice(0, -3);

  const recentPaymentRate = recentInvoices.filter(inv => inv.status === 'paid').length / recentInvoices.length;
  const olderPaymentRate = olderInvoices.length > 0 ? olderInvoices.filter(inv => inv.status === 'paid').length / olderInvoices.length : 0;

  if (recentPaymentRate > olderPaymentRate + 0.1) return 'improving';
  if (recentPaymentRate < olderPaymentRate - 0.1) return 'declining';
  return 'stable';
}

/**
 * Find overdue invoices across all customers or for specific customer
 * @param {string} customerId - Optional customer ID filter
 * @param {number} daysOverdue - Minimum days overdue (default: 30)
 * @returns {Array} - Overdue invoices with urgency levels
 */
async function findOverdueInvoices(customerId = null, daysOverdue = 30) {
  try {
    console.log(`⏰ Finding overdue invoices (${daysOverdue}+ days)${customerId ? ` for customer ${customerId}` : ''}`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOverdue);

    let overdueInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      const isPending = ['pending', 'partial'].includes(invoice.status);
      const isOverdue = invoiceDate < cutoffDate;
      const matchesCustomer = !customerId || invoice.customerId === customerId;

      return isPending && isOverdue && matchesCustomer;
    });

    // Add urgency levels and customer info
    overdueInvoices = overdueInvoices.map(invoice => {
      const invoiceDate = new Date(invoice.date);
      const daysOverdueCount = Math.floor((new Date() - invoiceDate) / (1000 * 60 * 60 * 24));
      const customer = customers.find(c => c.id === invoice.customerId);

      let urgency = 'low';
      if (daysOverdueCount > 90) urgency = 'critical';
      else if (daysOverdueCount > 60) urgency = 'high';
      else if (daysOverdueCount > 30) urgency = 'medium';

      return {
        ...invoice,
        customerName: customer?.name || 'Unknown',
        customerCompany: customer?.company || '',
        daysOverdue: daysOverdueCount,
        urgency,
        remainingBalance: invoice.remainingBalance || invoice.amount,
        type: 'overdue_invoice'
      };
    });

    // Sort by urgency and days overdue
    overdueInvoices.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      }
      return b.daysOverdue - a.daysOverdue;
    });

    console.log(`✅ Found ${overdueInvoices.length} overdue invoices`);

    return overdueInvoices;

  } catch (error) {
    console.error('❌ Error finding overdue invoices:', error);
    throw new Error(`Failed to find overdue invoices: ${error.message}`);
  }
}

module.exports = {
  findCustomerByName,
  findInvoiceById,
  getPendingInvoices,
  getAvailableCredits,
  findInvoicesByCustomerName,
  universalSearch,
  getCustomerPaymentHistory,
  findOverdueInvoices
};
