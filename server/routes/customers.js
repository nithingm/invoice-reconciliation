const express = require('express');
const router = express.Router();

// GET /api/customers - Get all customers
router.get('/', async (req, res) => {
  try {
    const database = req.app.locals.database;
    const customers = await database.Customer.find({});

    const customersWithSummary = await Promise.all(customers.map(async (customer) => {
      try {
        const totalActiveCredits = await database.getCustomerTotalActiveCredits(customer.id) || 0;
        const activeCreditsCount = (await database.getCustomerActiveCredits(customer.id) || []).length;
        const pendingInvoices = (await database.getCustomerPendingInvoices(customer.id) || []).length;
        const totalInvoices = (await database.getCustomerInvoices(customer.id) || []).length;

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          totalActiveCredits,
          activeCreditsCount,
          pendingInvoices,
          totalInvoices
        };
      } catch (customerError) {
        console.error(`❌ Error processing customer ${customer.id}:`, customerError);
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          totalActiveCredits: 0,
          activeCreditsCount: 0,
          pendingInvoices: 0,
          totalInvoices: 0
        };
      }
    }));

    res.json({ customers: customersWithSummary });
  } catch (error) {
    console.error('Customers lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const database = req.app.locals.database;

    const customerWithDetails = await database.getCustomerWithCreditsAndInvoices(id);
    if (!customerWithDetails) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const purchaseHistory = await database.getCustomerPurchaseHistory(id);

    res.json({
      ...customerWithDetails,
      purchaseHistory
    });
  } catch (error) {
    console.error('Customer lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/customers/:id/credits
router.get('/:id/credits', async (req, res) => {
  try {
    const { id } = req.params;
    const database = req.app.locals.database;

    const customer = await database.getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const activeCredits = await database.getCustomerActiveCredits(id);
    const totalCredits = await database.getCustomerTotalActiveCredits(id);

    res.json({
      customerId: id,
      activeCredits,
      totalAmount: totalCredits
    });
  } catch (error) {
    console.error('Credits lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/customers/:id/invoices
router.get('/:id/invoices', async (req, res) => {
  try {
    const { id } = req.params;
    const database = req.app.locals.database;

    const customer = await database.getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const invoices = await database.getCustomerInvoices(id);

    res.json({ customerId: id, invoices });
  } catch (error) {
    console.error('Invoices lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
