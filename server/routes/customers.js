const express = require('express');
const router = express.Router();

// GET /api/customers - Get all customers
router.get('/', async (req, res) => {
  try {
    const database = req.app.locals.database;

    console.log(' Database check - database exists:', !!database);
    if (database) {
      console.log(' Database has customers:', !!database.customers);
      console.log('Database has helper functions:', !!database.getCustomerActiveCredits);
    }

    if (!database) {
      console.error('❌ Database is null/undefined');
      return res.status(500).json({ error: 'Database not available' });
    }

    if (!database.customers) {
      console.error('❌ Database.customers is null/undefined');
      return res.status(500).json({ error: 'Database customers not available' });
    }

    if (!database.getCustomerActiveCredits) {
      console.error('❌ Database.getCustomerActiveCredits is null/undefined');
      return res.status(500).json({ error: 'Database helper functions not available' });
    }

    // Calculate summary data for each customer using the new database helper functions
    const customersWithSummary = database.customers.map(customer => {
      try {
        const activeCredits = database.getCustomerActiveCredits(customer.id) || [];
        const totalActiveCredits = database.getCustomerTotalActiveCredits(customer.id) || 0;
        const activeCreditsCount = activeCredits.length;

        const customerInvoices = database.getCustomerInvoices(customer.id) || [];
        const pendingInvoices = (database.getCustomerPendingInvoices(customer.id) || []).length;
        const totalInvoices = customerInvoices.length;

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
    });

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

    // Use the new database helper function to get customer with all related data
    const customerWithDetails = database.getCustomerWithCreditsAndInvoices(id);
    if (!customerWithDetails) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Add purchase history
    const purchaseHistory = database.getCustomerPurchaseHistory(id);

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

    const customer = database.getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const activeCredits = database.getCustomerActiveCredits(id);
    const totalCredits = database.getCustomerTotalActiveCredits(id);

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

    const customer = database.getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const invoices = database.getCustomerInvoices(id);

    res.json({ customerId: id, invoices });
  } catch (error) {
    console.error('Invoices lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
