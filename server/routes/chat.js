const express = require('express');
const router = express.Router();

// POST /api/chat/message
router.post('/message', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Use the same AI processing function from the main server
    // Import the processing function (we'll need to export it from index.js)
    const response = await processMessageWithOllama(message);

    res.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI Processing Function for REST API (same logic as Socket.io)
async function processMessageWithOllama(message) {
  try {
    // Extract information using Ollama
    const extractedInfo = await extractInfoWithOllama(message);

    // If we have extracted invoice/customer info, proceed with validation
    if (extractedInfo.invoiceId || extractedInfo.customerId) {
      return await validateCredits(extractedInfo.invoiceId, extractedInfo.customerId, extractedInfo.creditAmount);
    }

    // Handle general queries with Ollama
    return await handleGeneralQuery(message);

  } catch (error) {
    console.error('Ollama processing error:', error);
    // Fallback to simple response
    return {
      message: 'I can help you with invoice inquiries, credit validation, and account information. How can I assist you today?',
      type: 'general'
    };
  }
}

// Extract information using Ollama (same as in index.js)
async function extractInfoWithOllama(message) {
  try {
    const { Ollama } = require('ollama');
    const ollama = new Ollama({ host: 'http://localhost:11434' });

    const prompt = `You are an AI assistant for a transmission remanufacturing company. Extract the following information from the user's message:

User message: "${message}"

Extract and return ONLY a JSON object with these fields (use null if not found):
{
  "invoiceId": "invoice ID (format: INV001, INV002, etc.)",
  "customerId": "customer ID (format: CUST001, CUST002, etc.)",
  "creditAmount": "credit amount as number (e.g., 150 for $150)",
  "intent": "user's intent: 'credit_validation', 'invoice_inquiry', 'account_info', or 'general'"
}

Available data for reference:
- Customers: CUST001 (John Smith), CUST002 (Sarah Johnson)
- Invoices: INV001 ($2500), INV002 ($3200)

Return ONLY the JSON object, no other text.`;

    const response = await ollama.chat({
      model: 'llama3.2:3b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    // Parse the JSON response
    const jsonMatch = response.message.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0]);
      return {
        invoiceId: extracted.invoiceId,
        customerId: extracted.customerId,
        creditAmount: extracted.creditAmount || 0,
        intent: extracted.intent || 'general'
      };
    }

    return { invoiceId: null, customerId: null, creditAmount: 0, intent: 'general' };

  } catch (error) {
    console.error('Ollama extraction error:', error);
    return { invoiceId: null, customerId: null, creditAmount: 0, intent: 'general' };
  }
}

// Handle general queries with Ollama (same as in index.js)
async function handleGeneralQuery(message) {
  try {
    const { Ollama } = require('ollama');
    const ollama = new Ollama({ host: 'http://localhost:11434' });

    const prompt = `You are a helpful customer service AI for TransMaster Pro, a transmission remanufacturing company.

Company Information:
- We specialize in remanufacturing automobile transmissions
- We offer credit validation and invoice management services
- Available customers: CUST001 (John Smith), CUST002 (Sarah Johnson)
- Available invoices: INV001 ($2500 for 4L60E), INV002 ($3200 for 4L80E)

User message: "${message}"

Provide a helpful, professional response. If the user is asking about:
- Invoice inquiries: Ask for invoice ID and customer ID
- Credit validation: Ask for invoice ID, customer ID, and credit amount
- Account information: Ask for customer ID
- General questions: Provide helpful information about our services

Keep responses concise and professional. Always offer to help with specific tasks.`;

    const response = await ollama.chat({
      model: 'llama3.2:3b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    return {
      message: response.message.content,
      type: 'general'
    };

  } catch (error) {
    console.error('Ollama general query error:', error);
    return {
      message: 'I can help you with invoice inquiries, credit validation, and account information. How can I assist you today?',
      type: 'general'
    };
  }
}


async function validateCredits(invoiceId, customerId, creditAmount) {
  try {
    // Find customer
    let customer = null;
    if (customerId) {
      customer = mockDatabase.customers.find(c => c.id === customerId);
    }

    // Find invoice
    let invoice = null;
    if (invoiceId) {
      invoice = mockDatabase.invoices.find(i => i.id === invoiceId);
      if (invoice && !customer) {
        customer = mockDatabase.customers.find(c => c.id === invoice.customerId);
      }
    }

    if (!customer && !invoice) {
      return {
        message: 'I couldn\'t find the customer or invoice information. Could you please provide a valid customer ID (e.g., CUST001) or invoice ID (e.g., INV001)?',
        type: 'error'
      };
    }

    if (!customer) {
      return {
        message: `I couldn't find customer ${customerId}. Available customers are CUST001 (John Smith) and CUST002 (Sarah Johnson).`,
        type: 'error'
      };
    }

    if (!invoice) {
      return {
        message: `I couldn't find invoice ${invoiceId}. Available invoices are INV001 ($2500) and INV002 ($3200).`,
        type: 'error'
      };
    }

    // Calculate available credits
    const activeCredits = customer.credits.filter(c =>
      c.status === 'active' && new Date(c.expiryDate) > new Date()
    );
    const totalAvailableCredits = activeCredits.reduce((sum, credit) => sum + credit.amount, 0);

    if (creditAmount > totalAvailableCredits) {
      return {
        message: `🔴Insufficient credits. You have $${totalAvailableCredits} in active credits, but requested $${creditAmount}.`,
        type: 'error'
      };
    }

    return {
      message: `🟢 Credit request validation successful! You can apply $${creditAmount} in credits to invoice ${invoice.id}. Your remaining credit balance will be $${totalAvailableCredits - creditAmount}.`,
      type: 'success',
      details: {
        invoiceId: invoice.id,
        customerId: customer.id,
        customerName: customer.name,
        invoiceAmount: invoice.amount,
        creditApplied: creditAmount,
        remainingCredits: totalAvailableCredits - creditAmount
      }
    };

  } catch (error) {
    console.error('Credit validation error:', error);
    return {
      message: 'An error occurred during credit validation. Please try again.',
      type: 'error'
    };
  }
}

// GET /api/chat/history (for future implementation)
router.get('/history/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // In a real implementation, fetch chat history from database
    const history = [];
    
    res.json({ history });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
