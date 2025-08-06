const express = require('express');
const router = express.Router();

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mockDatabase = req.app.locals.mockDatabase;
    
    const customer = mockDatabase.customers.find(c => c.id === id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Customer lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/customers/:id/credits
router.get('/:id/credits', async (req, res) => {
  try {
    const { id } = req.params;
    const mockDatabase = req.app.locals.mockDatabase;
    
    const customer = mockDatabase.customers.find(c => c.id === id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const activeCredits = customer.credits.filter(c => 
      c.status === 'active' && new Date(c.expiryDate) > new Date()
    );

    const totalCredits = activeCredits.reduce((sum, credit) => sum + credit.amount, 0);

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
    const mockDatabase = req.app.locals.mockDatabase;
    
    const invoices = mockDatabase.invoices.filter(i => i.customerId === id);
    
    res.json({ customerId: id, invoices });
  } catch (error) {
    console.error('Invoices lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
