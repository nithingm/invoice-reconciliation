/**
 * Main Database Module - MongoDB Integration
 * Provides relational queries and data integrity functions using MongoDB
 */

const Customer = require('../models/Customer');
const Credit = require('../models/Credit');
const Invoice = require('../models/Invoice');

/**
 * Database Helper Functions
 * Provides relational queries and data integrity functions
 */

// Customer-related queries
const getCustomerById = async (customerId) => {
  return await Customer.findOne({ id: customerId });
};

const getCustomerByName = async (customerName) => {
  const name = customerName.toLowerCase();
  return await Customer.findOne({
    $or: [
      { name: { $regex: name, $options: 'i' } },
      { name: { $regex: new RegExp(name.split(' ').join('.*'), 'i') } }
    ]
  });
};

const getCustomerCredits = async (customerId) => {
  return await Credit.find({ customerId });
};

const getCustomerInvoices = async (customerId) => {
  return await Invoice.find({ customerId });
};

const getCustomerActiveCredits = async (customerId) => {
  return await Credit.find({
    customerId,
    status: { $in: ['active', 'partially_used'] },
    amount: { $gt: 0 },
    expiryDate: { $gt: new Date() }
  });
};

const getCustomerTotalActiveCredits = async (customerId) => {
  const activeCredits = await getCustomerActiveCredits(customerId);
  return activeCredits.reduce((total, credit) => total + credit.amount, 0);
};

// Credit-related queries
const getCreditById = async (creditId) => {
  return await Credit.findOne({ id: creditId });
};

const getCreditsByCustomer = async (customerId) => {
  return await Credit.find({ customerId });
};

const getExpiredCredits = async () => {
  return await Credit.find({ expiryDate: { $lte: new Date() } });
};

const getActiveCredits = async () => {
  return await Credit.find({
    status: 'active',
    amount: { $gt: 0 },
    expiryDate: { $gt: new Date() }
  });
};

// Invoice-related queries
const getInvoiceById = async (invoiceId) => {
  return await Invoice.findOne({ id: invoiceId });
};

const getInvoicesByCustomer = async (customerId) => {
  return await Invoice.find({ customerId });
};

const getPendingInvoices = async () => {
  return await Invoice.find({ status: 'pending' });
};

const getPaidInvoices = async () => {
  return await Invoice.find({ status: 'paid' });
};

const getCustomerLatestInvoice = async (customerId) => {
  return await Invoice.findOne({ customerId }).sort({ date: -1 });
};

const getCustomerPendingInvoices = async (customerId) => {
  return await Invoice.find({ customerId, status: 'pending' });
};

// Relational queries
const getCustomerWithCreditsAndInvoices = async (customerId) => {
  const customer = await getCustomerById(customerId);
  if (!customer) return null;

  const [credits, invoices, activeCredits, totalActiveCredits] = await Promise.all([
    getCustomerCredits(customerId),
    getCustomerInvoices(customerId),
    getCustomerActiveCredits(customerId),
    getCustomerTotalActiveCredits(customerId)
  ]);

  return {
    ...customer.toObject(),
    credits,
    invoices,
    activeCredits,
    totalActiveCredits
  };
};

const getInvoiceWithCustomerAndCredits = async (invoiceId) => {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) return null;

  const [customer, appliedCredits] = await Promise.all([
    getCustomerById(invoice.customerId),
    Credit.find({ id: { $in: invoice.appliedCreditIds } })
  ]);

  return {
    ...invoice.toObject(),
    customer,
    appliedCredits
  };
};

const getCreditWithCustomerAndInvoice = async (creditId) => {
  const credit = await getCreditById(creditId);
  if (!credit) return null;

  const [customer, sourceInvoice] = await Promise.all([
    getCustomerById(credit.customerId),
    credit.sourceInvoiceId ? getInvoiceById(credit.sourceInvoiceId) : null
  ]);

  return {
    ...credit.toObject(),
    customer,
    sourceInvoice
  };
};

// Data manipulation functions
const applyCreditsToInvoice = async (invoiceId, creditIds, amounts) => {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) return { success: false, error: 'Invoice not found' };

  let totalCreditsApplied = 0;
  const appliedCredits = [];

  for (let i = 0; i < creditIds.length; i++) {
    const creditId = creditIds[i];
    const amountToApply = amounts[i] || 0;
    
    const credit = await getCreditById(creditId);
    
    if (credit && credit.amount >= amountToApply) {
      credit.amount -= amountToApply;
      if (credit.amount === 0) {
        credit.status = 'used';
      } else if (credit.amount < credit.originalAmount) {
        credit.status = 'partially_used';
      }

      // Add to usage history
      credit.usageHistory.push({
        date: new Date(),
        amount: amountToApply,
        appliedToInvoice: invoiceId,
        description: `Credit applied to invoice ${invoiceId}`
      });

      await credit.save();
      
      totalCreditsApplied += amountToApply;
      appliedCredits.push(creditId);
    }
  }

  // Update invoice
  invoice.creditsApplied += totalCreditsApplied;
  invoice.currentAmount -= totalCreditsApplied;
  invoice.appliedCreditIds.push(...appliedCredits);
  
  await invoice.save();

  return {
    success: true,
    totalCreditsApplied,
    newInvoiceAmount: invoice.currentAmount,
    appliedCredits
  };
};

// Purchase history with detailed information
const getCustomerPurchaseHistory = async (customerId) => {
  const customerInvoices = await Invoice.find({ customerId }).sort({ date: -1 });

  const purchaseHistory = [];
  
  for (const invoice of customerInvoices) {
    let creditsEarned = 0;
    if (invoice.earnedCreditIds.length > 0) {
      const earnedCredits = await Credit.find({ id: { $in: invoice.earnedCreditIds } });
      creditsEarned = earnedCredits.reduce((total, credit) => total + credit.originalAmount, 0);
    }
    
    purchaseHistory.push({
      invoiceId: invoice.id,
      date: invoice.date,
      amount: invoice.originalAmount,
      currentAmount: invoice.currentAmount,
      creditsApplied: invoice.creditsApplied,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      description: invoice.description,
      itemCount: invoice.items.length,
      creditsEarned
    });
  }
  
  return purchaseHistory;
};

// Export the complete database
module.exports = {
  // MongoDB Models
  Customer,
  Credit,
  Invoice,

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
