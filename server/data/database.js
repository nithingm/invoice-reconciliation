/**
 * Main Database Module
 * Combines all mock data entities with relational helper functions
 */

const customers = require('./customers');
const credits = require('./credits');
const invoices = require('./invoices');

/**
 * Database Helper Functions
 * Provides relational queries and data integrity functions
 */

// Customer-related queries
const getCustomerById = (customerId) => {
  return customers.find(customer => customer.id === customerId);
};

const getCustomerByName = (customerName) => {
  const name = customerName.toLowerCase();
  return customers.find(customer => 
    customer.name.toLowerCase().includes(name) || 
    name.includes(customer.name.toLowerCase())
  );
};

const getCustomerCredits = (customerId) => {
  return credits.filter(credit => credit.customerId === customerId);
};

const getCustomerInvoices = (customerId) => {
  return invoices.filter(invoice => invoice.customerId === customerId);
};

const getCustomerActiveCredits = (customerId) => {
  return credits.filter(credit =>
    credit.customerId === customerId &&
    (credit.status === 'active' || credit.status === 'partially_used') &&
    credit.amount > 0 &&
    new Date(credit.expiryDate) > new Date()
  );
};

const getCustomerTotalActiveCredits = (customerId) => {
  const activeCredits = getCustomerActiveCredits(customerId);
  return activeCredits.reduce((total, credit) => total + credit.amount, 0);
};

// Credit-related queries
const getCreditById = (creditId) => {
  return credits.find(credit => credit.id === creditId);
};

const getCreditsByCustomer = (customerId) => {
  return credits.filter(credit => credit.customerId === customerId);
};

const getExpiredCredits = () => {
  const now = new Date();
  return credits.filter(credit => new Date(credit.expiryDate) <= now);
};

const getActiveCredits = () => {
  const now = new Date();
  return credits.filter(credit => 
    credit.status === 'active' && 
    credit.amount > 0 &&
    new Date(credit.expiryDate) > now
  );
};

// Invoice-related queries
const getInvoiceById = (invoiceId) => {
  return invoices.find(invoice => invoice.id === invoiceId);
};

const getInvoicesByCustomer = (customerId) => {
  return invoices.filter(invoice => invoice.customerId === customerId);
};

const getPendingInvoices = () => {
  return invoices.filter(invoice => invoice.status === 'pending');
};

const getPaidInvoices = () => {
  return invoices.filter(invoice => invoice.status === 'paid');
};

const getCustomerLatestInvoice = (customerId) => {
  const customerInvoices = getInvoicesByCustomer(customerId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return customerInvoices[0] || null;
};

const getCustomerPendingInvoices = (customerId) => {
  return invoices.filter(invoice => 
    invoice.customerId === customerId && 
    invoice.status === 'pending'
  );
};

// Relational queries
const getCustomerWithCreditsAndInvoices = (customerId) => {
  const customer = getCustomerById(customerId);
  if (!customer) return null;

  return {
    ...customer,
    credits: getCustomerCredits(customerId),
    invoices: getCustomerInvoices(customerId),
    activeCredits: getCustomerActiveCredits(customerId),
    totalActiveCredits: getCustomerTotalActiveCredits(customerId)
  };
};

const getInvoiceWithCustomerAndCredits = (invoiceId) => {
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) return null;

  const customer = getCustomerById(invoice.customerId);
  const relatedCredits = invoice.appliedCreditIds.map(creditId => getCreditById(creditId));

  return {
    ...invoice,
    customer,
    appliedCredits: relatedCredits.filter(credit => credit !== undefined)
  };
};

const getCreditWithCustomerAndInvoice = (creditId) => {
  const credit = getCreditById(creditId);
  if (!credit) return null;

  const customer = getCustomerById(credit.customerId);
  const sourceInvoice = credit.sourceInvoiceId ? getInvoiceById(credit.sourceInvoiceId) : null;

  return {
    ...credit,
    customer,
    sourceInvoice
  };
};

// Data manipulation functions
const applyCreditsToInvoice = (invoiceId, creditIds, amounts) => {
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) return false;

  let totalCreditsApplied = 0;
  const appliedCredits = [];

  creditIds.forEach((creditId, index) => {
    const credit = getCreditById(creditId);
    const amountToApply = amounts[index] || 0;

    if (credit && credit.amount >= amountToApply) {
      credit.amount -= amountToApply;
      if (credit.amount === 0) {
        credit.status = 'used';
      } else if (credit.amount < credit.originalAmount) {
        credit.status = 'partially_used';
      }

      // Add to usage history
      credit.usageHistory.push({
        date: new Date().toISOString().split('T')[0],
        amount: amountToApply,
        appliedToInvoice: invoiceId,
        description: `Credit applied to invoice ${invoiceId}`
      });

      totalCreditsApplied += amountToApply;
      appliedCredits.push(creditId);
    }
  });

  // Update invoice
  invoice.creditsApplied += totalCreditsApplied;
  invoice.currentAmount -= totalCreditsApplied;
  invoice.appliedCreditIds.push(...appliedCredits);

  return {
    success: true,
    totalCreditsApplied,
    newInvoiceAmount: invoice.currentAmount,
    appliedCredits
  };
};

// Purchase history with detailed information
const getCustomerPurchaseHistory = (customerId) => {
  const customerInvoices = getInvoicesByCustomer(customerId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return customerInvoices.map(invoice => ({
    invoiceId: invoice.id,
    date: invoice.date,
    amount: invoice.originalAmount,
    currentAmount: invoice.currentAmount,
    creditsApplied: invoice.creditsApplied,
    status: invoice.status,
    paymentStatus: invoice.paymentStatus,
    description: invoice.description,
    itemCount: invoice.items.length,
    creditsEarned: invoice.earnedCreditIds.length > 0 ? 
      invoice.earnedCreditIds.reduce((total, creditId) => {
        const credit = getCreditById(creditId);
        return total + (credit ? credit.originalAmount : 0);
      }, 0) : 0
  }));
};

// Export the complete database
module.exports = {
  // Raw data
  customers,
  credits,
  invoices,

  // Customer queries
  getCustomerById,
  getCustomerByName,
  getCustomerCredits,
  getCustomerInvoices,
  getCustomerActiveCredits,
  getCustomerTotalActiveCredits,

  // Credit queries
  getCreditById,
  getCreditsByCustomer,
  getExpiredCredits,
  getActiveCredits,

  // Invoice queries
  getInvoiceById,
  getInvoicesByCustomer,
  getPendingInvoices,
  getPaidInvoices,
  getCustomerLatestInvoice,
  getCustomerPendingInvoices,

  // Relational queries
  getCustomerWithCreditsAndInvoices,
  getInvoiceWithCustomerAndCredits,
  getCreditWithCustomerAndInvoice,

  // Data manipulation
  applyCreditsToInvoice,
  getCustomerPurchaseHistory
};
