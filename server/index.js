const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const mockDatabase = require('./data/mockDatabase');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const chatRoutes = require('./routes/chat');
const customerRoutes = require('./routes/customers');

// Use routes
app.use('/api/chat', chatRoutes);
app.use('/api/customers', customerRoutes);

// Data is now imported from external file

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('chat_message', async (data) => {
    try {
      const response = await processAIQuery(data.message);
      socket.emit('ai_response', response);
    } catch (error) {
      socket.emit('ai_response', {
        message: 'Sorry, I encountered an error processing your request. Please try again.',
        type: 'error'
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Enhanced AI Processing Function - Direct Python Microservice Integration
async function processAIQuery(message) {
  try {
    console.log('🤖 Processing message:', message);

    // Quick pattern matching for credit applications
    const lowerMessage = message.toLowerCase();
    const hasCredit = lowerMessage.includes('credit') || lowerMessage.includes('dollar');
    const hasCustomer = lowerMessage.includes('cust') || lowerMessage.includes('john') || lowerMessage.includes('sarah') || lowerMessage.includes('mike');
    const hasAmount = /\d+/.test(message);
    const hasRequest = lowerMessage.includes('request') || lowerMessage.includes('apply') || lowerMessage.includes('need');

    if (hasCredit && hasCustomer && hasAmount && hasRequest) {
      console.log('🎯 Detected credit application request');

      // Extract customer ID
      let customerId = null;
      const customerMatch = message.match(/(cust\w*)\s*(\w+)/i);
      if (customerMatch) {
        customerId = customerMatch[2].toUpperCase();
        if (!customerId.startsWith('CUST')) {
          customerId = 'CUST' + customerId.padStart(3, '0');
        }
      } else if (lowerMessage.includes('john')) {
        customerId = 'CUST001';
      } else if (lowerMessage.includes('sarah')) {
        customerId = 'CUST002';
      } else if (lowerMessage.includes('mike')) {
        customerId = 'CUST003';
      }

      // Extract credit amount
      let creditAmount = 0;
      const amountMatch = message.match(/(\d+)/);
      if (amountMatch) {
        creditAmount = parseInt(amountMatch[1]);
      }

      console.log('🔍 Extracted:', { customerId, creditAmount });

      if (customerId && creditAmount > 0) {
        return await processDirectCreditApplication(customerId, creditAmount);
      }
    }

    // Fallback to general query
    return await handleGeneralQuery(message);

  } catch (error) {
    console.error('❌ Processing error:', error);
    return {
      message: 'I encountered an error processing your request. Please try again.',
      type: 'error'
    };
  }
}

// Direct credit application processing using Python microservice
async function processDirectCreditApplication(customerId, creditAmount) {
  try {
    console.log('💳 Direct credit application:', { customerId, creditAmount });

    // Call Python microservice directly
    const pythonResult = await callPythonMicroservice('apply', {
      customer_id: customerId,
      customer_name: null,
      credit_amount: creditAmount,
      invoice_id: null,
      mock_data: mockDatabase
    });

    console.log('🐍 Python result:', pythonResult);

    if (pythonResult.error) {
      return {
        message: `❌ System Error: ${pythonResult.error}`,
        type: 'error'
      };
    }

    if (!pythonResult.success) {
      const errors = pythonResult.validation_errors || [];
      return {
        message: `❌ Credit Application Failed\n\n${errors.join('\n')}`,
        type: 'error'
      };
    }

    // Success - generate response
    const transaction = pythonResult.transaction;
    const response = `✅ Credit Application Successful!\n\n` +
                    `Dear ${transaction.customer_name},\n\n` +
                    `Thank you for reaching out to TransMaster Pro regarding your recent transmission service. ` +
                    `We are pleased to inform you that your request has been successfully processed.\n\n` +
                    `To summarize, we have applied a credit of $${transaction.credit_amount_applied} to your account, ` +
                    `which brings the new total balance to $${transaction.new_invoice_amount}. ` +
                    `This adjustment reflects the original amount of $${transaction.original_invoice_amount} minus the credit applied.\n\n` +
                    `You now have $${transaction.remaining_credits} in remaining credits, which can be used towards future services. ` +
                    `We appreciate your business and are committed to providing you with excellent service.\n\n` +
                    `As part of our follow-up process, we will be sending out a new invoice to your email address ` +
                    `(${transaction.customer_email}) for the updated balance of $${transaction.new_invoice_amount}. ` +
                    `Please note that this invoice will include all applicable taxes and fees.\n\n` +
                    `If you have any questions or concerns regarding your account, please do not hesitate to contact us. ` +
                    `We are here to assist you.\n\n` +
                    `Thank you again for choosing TransMaster Pro.\n\n` +
                    `Best regards,\nThe TransMaster Pro Team\n\n` +
                    `Details:\n` +
                    `Invoice: ${transaction.invoice_id}\n` +
                    `Customer: ${transaction.customer_name} (${transaction.customer_id})\n` +
                    `Credit Applied: $${transaction.credit_amount_applied}\n` +
                    `Remaining Credits: $${transaction.remaining_credits}`;

    return {
      message: response,
      type: 'success',
      details: transaction
    };

  } catch (error) {
    console.error('❌ Direct credit application error:', error);
    return {
      message: `❌ Credit Application Error: ${error.message}`,
      type: 'error'
    };
  }
}

// Reliable entity extraction using regex patterns (no LLM dependency)
function extractEntitiesReliably(message) {
  const lowerMessage = message.toLowerCase();
  console.log('🔍 Analyzing message:', message);

  // Extract customer information
  let customerId = null;
  let customerName = null;

  // Look for customer ID patterns
  const customerIdMatch = message.match(/(cust\w*|customer\s*id)\s*[:#]?\s*(cust\d+|\d+)/i);
  if (customerIdMatch) {
    let id = customerIdMatch[2].toUpperCase();
    if (!id.startsWith('CUST')) {
      id = 'CUST' + id.padStart(3, '0');
    }
    customerId = id;
  }

  // Look for customer names
  if (!customerId) {
    if (lowerMessage.includes('john') || lowerMessage.includes('smith')) {
      customerId = 'CUST001';
      customerName = 'John Smith';
    } else if (lowerMessage.includes('sarah') || lowerMessage.includes('johnson')) {
      customerId = 'CUST002';
      customerName = 'Sarah Johnson';
    } else if (lowerMessage.includes('mike') || lowerMessage.includes('wilson')) {
      customerId = 'CUST003';
      customerName = 'Mike Wilson';
    }
  }

  // Extract invoice ID
  const invoiceMatch = message.match(/inv\w*\s*[:#]?\s*(\w+)/i);
  const invoiceId = invoiceMatch ? invoiceMatch[1].toUpperCase() : null;

  // Extract credit amount with more patterns
  let creditAmount = 0;
  const creditMatches = [
    message.match(/(\d+)\s*credits?/i),
    message.match(/\$(\d+)/),
    message.match(/apply\s*(\d+)/i),
    message.match(/use\s*(\d+)/i),
    message.match(/(\d+)\s*dollar/i),
    message.match(/request.*?(\d+)/i),
    message.match(/(\d+).*?credit/i)
  ];

  console.log('🔍 Credit amount patterns test:', {
    message: message,
    patterns: creditMatches.map((match, i) => ({ pattern: i, match: match ? match[0] : null, amount: match ? match[1] : null }))
  });

  for (const match of creditMatches) {
    if (match) {
      creditAmount = parseInt(match[1]);
      console.log('✅ Found credit amount:', creditAmount, 'from pattern:', match[0]);
      break;
    }
  }

  // Determine intent based on keywords and extracted data
  let intent = 'general';

  if ((lowerMessage.includes('apply') || lowerMessage.includes('use') ||
       lowerMessage.includes('request') || lowerMessage.includes('need')) &&
      creditAmount > 0 && (customerId || customerName)) {
    intent = 'credit_application';
  } else if ((lowerMessage.includes('credit') && lowerMessage.includes('balance')) ||
             lowerMessage.includes('available') || lowerMessage.includes('check')) {
    intent = 'credit_inquiry';
  } else if (lowerMessage.includes('invoice') || lowerMessage.includes('validate')) {
    intent = 'invoice_inquiry';
  }

  const result = {
    intent,
    customerId,
    customerName,
    invoiceId,
    creditAmount,
    confidence: customerId ? 0.9 : 0.5
  };

  console.log('✅ Extraction result:', result);
  return result;
}

// Process credit application using Python microservice
async function processCreditApplication(extractedInfo, originalMessage) {
  try {
    console.log('💳 Processing credit application with Python microservice:', extractedInfo);

    // Call Python microservice for validation and calculation
    console.log('🐍 About to call Python microservice with:', {
      customer_id: extractedInfo.customerId,
      customer_name: extractedInfo.customerName,
      credit_amount: extractedInfo.creditAmount,
      invoice_id: extractedInfo.invoiceId
    });

    const pythonResult = await callPythonMicroservice('apply', {
      customer_id: extractedInfo.customerId,
      customer_name: extractedInfo.customerName,
      credit_amount: extractedInfo.creditAmount,
      invoice_id: extractedInfo.invoiceId,
      mock_data: mockDatabase
    });

    console.log('🐍 Python microservice result:', JSON.stringify(pythonResult, null, 2));

    if (pythonResult.error) {
      return {
        message: `❌ Microservice Error: ${pythonResult.error}`,
        type: 'error'
      };
    }

    if (!pythonResult.success) {
      // Handle validation errors
      const errors = pythonResult.validation_errors || [];
      const warnings = pythonResult.warnings || [];

      let errorMessage = '❌ Credit Application Failed\n\n';

      if (pythonResult.customer_found && pythonResult.customer_info) {
        errorMessage += `Customer: ${pythonResult.customer_info.name} (${pythonResult.customer_info.id})\n`;
      }

      if (pythonResult.credit_info) {
        errorMessage += `Requested: $${extractedInfo.creditAmount}\n`;
        errorMessage += `Available: $${pythonResult.credit_info.total_available}\n\n`;
      }

      errorMessage += errors.join('\n');

      if (warnings.length > 0) {
        errorMessage += '\n\nWarnings:\n' + warnings.join('\n');
      }

      return {
        message: errorMessage,
        type: 'error'
      };
    }

    // Success - generate human-friendly response using LLM
    const humanResponse = await generateResponseWithLLM({
      success: true,
      customerName: pythonResult.transaction.customer_name,
      customerEmail: pythonResult.transaction.customer_email,
      invoiceId: pythonResult.transaction.invoice_id,
      creditAmount: pythonResult.transaction.credit_amount_applied,
      originalAmount: pythonResult.transaction.original_invoice_amount,
      previousAmount: pythonResult.transaction.previous_invoice_amount,
      newAmount: pythonResult.transaction.new_invoice_amount,
      remainingCredits: pythonResult.transaction.remaining_credits,
      creditsUsed: pythonResult.credits_used
    });

    return {
      message: humanResponse,
      type: 'success',
      details: pythonResult.transaction
    };

  } catch (error) {
    console.error('❌ Credit application error:', error);
    console.error('❌ Error stack:', error.stack);
    return {
      message: `❌ Credit Application Error: ${error.message}\n\nPlease try again or contact support.`,
      type: 'error'
    };
  }
}

// Process credit inquiry
async function processCreditInquiry(extractedInfo, originalMessage) {
  try {
    const customer = findCustomerReliably(extractedInfo.customerId, extractedInfo.customerName);
    if (!customer) {
      return {
        message: `❌ Customer not found: ${extractedInfo.customerId || extractedInfo.customerName}`,
        type: 'error'
      };
    }

    const creditInfo = calculateCreditsReliably(customer);
    const customerInvoices = mockDatabase.invoices.filter(i => i.customerId === customer.id);
    const pendingInvoices = customerInvoices.filter(i => i.status === 'pending');

    return {
      message: `💳 Credit Information for ${customer.name}\n\n` +
              `Customer ID: ${customer.id}\n` +
              `Total Active Credits: $${creditInfo.totalActive}\n` +
              `Active Credits: ${creditInfo.activeCredits.length}\n` +
              `Expired Credits: ${creditInfo.expiredCredits.length}\n` +
              `Pending Invoices: ${pendingInvoices.length}\n\n` +
              `Active Credits Details:\n${creditInfo.activeCredits.map(c => `• $${c.amount} (expires ${c.expiryDate})`).join('\n')}`,
      type: 'info'
    };

  } catch (error) {
    console.error('Credit inquiry error:', error);
    return {
      message: 'An error occurred while retrieving credit information.',
      type: 'error'
    };
  }
}

// Process invoice inquiry
async function processInvoiceInquiry(extractedInfo, originalMessage) {
  try {
    if (extractedInfo.invoiceId) {
      const invoice = mockDatabase.invoices.find(i => i.id === extractedInfo.invoiceId);
      if (!invoice) {
        return {
          message: `❌ Invoice not found: ${extractedInfo.invoiceId}`,
          type: 'error'
        };
      }

      const customer = mockDatabase.customers.find(c => c.id === invoice.customerId);
      const creditInfo = calculateCreditsReliably(customer);

      return {
        message: `📋 Invoice Details\n\n` +
                `Invoice: ${invoice.id}\n` +
                `Customer: ${customer.name} (${customer.id})\n` +
                `Amount: $${invoice.currentAmount}\n` +
                `Status: ${invoice.status}\n\n` +
                `Customer Credits: $${creditInfo.totalActive} available`,
        type: 'info'
      };
    }

    return {
      message: 'Please specify an invoice ID to check details.',
      type: 'error'
    };

  } catch (error) {
    console.error('Invoice inquiry error:', error);
    return {
      message: 'An error occurred while retrieving invoice information.',
      type: 'error'
    };
  }
}

// Call Python microservice for credit validation and calculation
async function callPythonMicroservice(action, data) {
  try {
    const { spawn } = require('child_process');
    const path = require('path');

    const pythonScript = path.join(__dirname, '..', 'python_microservice', 'credit_validator.py');
    const inputData = JSON.stringify({
      action: action,
      ...data
    });

    console.log('🐍 Calling Python microservice with:', { action, customer_id: data.customer_id, credit_amount: data.credit_amount });

    return new Promise((resolve, reject) => {
      const python = spawn('python', [pythonScript, inputData]);
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error('🐍 Python microservice error:', stderr);
          resolve({ error: `Python process exited with code ${code}: ${stderr}` });
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          console.log('🐍 Python microservice success:', result);
          resolve(result);
        } catch (parseError) {
          console.error('🐍 Python output parse error:', parseError, 'Output:', stdout);
          resolve({ error: `Failed to parse Python output: ${parseError.message}` });
        }
      });

      python.on('error', (error) => {
        console.error('🐍 Python spawn error:', error);
        resolve({ error: `Failed to start Python process: ${error.message}` });
      });
    });

  } catch (error) {
    console.error('🐍 Microservice call error:', error);
    return { error: `Microservice call failed: ${error.message}` };
  }
}

// Reliable customer finder
function findCustomerReliably(customerId, customerName) {
  if (customerId) {
    return mockDatabase.customers.find(c => c.id === customerId);
  }

  if (customerName) {
    const name = customerName.toLowerCase();
    return mockDatabase.customers.find(c =>
      c.name.toLowerCase().includes(name) || name.includes(c.name.toLowerCase())
    );
  }

  return null;
}

// Reliable invoice finder
function findInvoiceReliably(invoiceId, customerId) {
  if (invoiceId) {
    return mockDatabase.invoices.find(i => i.id === invoiceId);
  }

  if (customerId) {
    // Find customer's latest pending invoice
    const customerInvoices = mockDatabase.invoices
      .filter(i => i.customerId === customerId && i.status === 'pending')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return customerInvoices[0] || null;
  }

  return null;
}

// Reliable credit calculation with precise arithmetic
function calculateCreditsReliably(customer) {
  if (!customer || !customer.credits) {
    return {
      totalActive: 0,
      activeCredits: [],
      expiredCredits: [],
      usedCredits: []
    };
  }

  const now = new Date();
  const activeCredits = [];
  const expiredCredits = [];
  const usedCredits = [];

  customer.credits.forEach(credit => {
    const expiryDate = new Date(credit.expiryDate);

    if (credit.status === 'used') {
      usedCredits.push(credit);
    } else if (credit.status === 'active' && expiryDate > now) {
      activeCredits.push(credit);
    } else {
      expiredCredits.push(credit);
    }
  });

  // Use precise arithmetic to avoid floating point errors
  const totalActive = activeCredits.reduce((sum, credit) => {
    return Math.round((sum + credit.amount) * 100) / 100;
  }, 0);

  return {
    totalActive,
    activeCredits,
    expiredCredits,
    usedCredits
  };
}

// Apply credits with precise calculations and FIFO
function applyCreditsPrecisely(customer, invoice, creditAmount) {
  const originalAmount = invoice.originalAmount;
  const previousAmount = invoice.currentAmount;

  // Apply credits using FIFO (First In, First Out)
  const creditInfo = calculateCreditsReliably(customer);
  let remainingToApply = Math.round(creditAmount * 100) / 100;

  // Sort by earned date (oldest first)
  const sortedCredits = creditInfo.activeCredits.sort((a, b) =>
    new Date(a.earnedDate) - new Date(b.earnedDate)
  );

  for (const credit of sortedCredits) {
    if (remainingToApply <= 0) break;

    const availableInCredit = Math.round(credit.amount * 100) / 100;
    const amountToUse = Math.min(availableInCredit, remainingToApply);

    // Update credit in database
    credit.amount = Math.round((credit.amount - amountToUse) * 100) / 100;
    if (credit.amount === 0) {
      credit.status = 'used';
    }

    remainingToApply = Math.round((remainingToApply - amountToUse) * 100) / 100;
  }

  // Update invoice with precise arithmetic
  const newInvoiceAmount = Math.round((invoice.currentAmount - creditAmount) * 100) / 100;
  const previousCreditsApplied = invoice.creditsApplied || 0;

  invoice.currentAmount = newInvoiceAmount;
  invoice.creditsApplied = Math.round((previousCreditsApplied + creditAmount) * 100) / 100;

  // Calculate remaining credits
  const updatedCreditInfo = calculateCreditsReliably(customer);

  return {
    originalAmount,
    previousAmount,
    newAmount: newInvoiceAmount,
    creditAmount,
    remainingCredits: updatedCreditInfo.totalActive
  };
}

// Generate human-friendly response using LLM (only for language generation)
async function generateResponseWithLLM(data) {
  try {
    const { Ollama } = require('ollama');
    const ollama = new Ollama({ host: 'http://localhost:11434' });

    const prompt = `You are a professional customer service AI for TransMaster Pro transmission company.

Convert this transaction data into a natural, professional response:

${JSON.stringify(data, null, 2)}

Guidelines:
- Be professional and helpful
- Include all important details
- Use clear, easy-to-understand language
- Mention that a new invoice will be emailed
- Keep the tone friendly but business-appropriate

Generate a natural response:`;

    const response = await ollama.chat({
      model: 'llama3.2:3b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    return response.message.content.trim();

  } catch (error) {
    console.error('LLM response generation error:', error);

    // Fallback to structured response
    return `✅ Credit Application Successful!\n\n` +
           `Customer: ${data.customerName}\n` +
           `Invoice: ${data.invoiceId}\n` +
           `Credits Applied: $${data.creditAmount}\n` +
           `New Invoice Amount: $${data.newAmount}\n` +
           `Remaining Credits: $${data.remainingCredits}\n\n` +
           `📧 A new invoice will be sent to ${data.customerEmail}`;
  }
}

// Extract information using Ollama
async function extractInfoWithOllama(message) {
  try {
    const { Ollama } = require('ollama');
    const ollama = new Ollama({ host: 'http://localhost:11434' });

    const prompt = `Extract information from this customer service message and return ONLY valid JSON.

Message: "${message}"

Determine the intent:
- "invoice_inquiry" - just checking/validating invoice details (no credit application)
- "credit_application" - applying credits to an invoice (requires customer ID, invoice ID, and credit amount)

Rules:
- Find customer ID: CUST001, CUST002, CUST003 (exact format)
- Find invoice ID: INV001, INV002, INV003, INV004 (exact format)
- Find credit amount: any number with $ or "credit" (only if applying credits)
- Convert names: "John Smith"→CUST001, "Sarah Johnson"→CUST002, "Mike Wilson"→CUST003

Examples:
- "Validate invoice INV001" → invoice_inquiry (no credit application)
- "Apply $500 credit to INV001 for CUST001" → credit_application
- "Check invoice INV002" → invoice_inquiry

Return ONLY this JSON:
{
  "invoiceId": null,
  "customerId": null,
  "creditAmount": 0,
  "intent": "invoice_inquiry"
}`;

    const response = await ollama.chat({
      model: 'llama3.2:3b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    console.log('Ollama raw response:', response.message.content);

    // Parse the JSON response
    const jsonMatch = response.message.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      console.log('JSON match found:', jsonMatch[0]);
      try {
        const extracted = JSON.parse(jsonMatch[0]);
        console.log('Parsed JSON:', extracted);
        return {
          invoiceId: extracted.invoiceId === 'null' ? null : extracted.invoiceId,
          customerId: extracted.customerId === 'null' ? null : extracted.customerId,
          creditAmount: extracted.creditAmount || 0,
          intent: extracted.intent || 'general'
        };
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return { invoiceId: null, customerId: null, creditAmount: 0, intent: 'general' };
      }
    }

    console.log('No JSON match found in Ollama response');
    return { invoiceId: null, customerId: null, creditAmount: 0, intent: 'general' };

  } catch (error) {
    console.error('Ollama extraction error:', error);
    return { invoiceId: null, customerId: null, creditAmount: 0, intent: 'general' };
  }
}

// Handle invoice inquiry (just checking invoice details, not applying credits)
async function handleInvoiceInquiry(invoiceId, customerId) {
  try {
    console.log('handleInvoiceInquiry called with:', { invoiceId, customerId });

    // Find invoice
    let invoice = null;
    if (invoiceId) {
      invoice = mockDatabase.invoices.find(i => i.id === invoiceId);
    }

    if (!invoice) {
      return {
        message: `❌ Invoice Not Found\n\n` +
                `Invoice ID: ${invoiceId || 'Not provided'}\n\n` +
                `Available invoices:\n${mockDatabase.invoices.map(i => `• ${i.id} - ${i.description} ($${i.currentAmount})`).join('\n')}`,
        type: 'error'
      };
    }

    // Find customer for this invoice
    const customer = mockDatabase.customers.find(c => c.id === invoice.customerId);

    if (!customer) {
      return {
        message: `❌ Customer data not found for invoice ${invoice.id}`,
        type: 'error'
      };
    }

    // Calculate customer's available credits
    const now = new Date();
    const activeCredits = customer.credits.filter(c =>
      c.status === 'active' && new Date(c.expiryDate) > now
    );
    const totalAvailableCredits = activeCredits.reduce((sum, credit) => sum + credit.amount, 0);

    return {
      message: `📋 Invoice Details\n\n` +
              `Invoice: ${invoice.id}\n` +
              `Customer: ${customer.name} (${customer.id})\n` +
              `Description: ${invoice.description}\n` +
              `Original Amount: $${invoice.originalAmount}\n` +
              `Current Amount: $${invoice.currentAmount}\n` +
              `Credits Applied: $${invoice.creditsApplied}\n` +
              `Status: ${invoice.status}\n` +
              `Date: ${invoice.date}\n\n` +
              `💳 Customer Credit Information:\n` +
              `Available Credits: $${totalAvailableCredits}\n` +
              `Active Credits: ${activeCredits.length}\n\n` +
              `To apply credits: "Apply $[amount] credit to ${invoice.id} for ${customer.name}"`,
      type: 'info',
      details: {
        invoice: invoice,
        customer: customer,
        availableCredits: totalAvailableCredits,
        activeCredits: activeCredits
      }
    };

  } catch (error) {
    console.error('Invoice inquiry error:', error);
    return {
      message: 'An error occurred while retrieving invoice information. Please try again.',
      type: 'error'
    };
  }
}

// Handle general queries with Ollama
async function handleGeneralQuery(message) {
  try {
    const { Ollama } = require('ollama');
    const ollama = new Ollama({ host: 'http://localhost:11434' });

    const prompt = `You are a customer service AI for TransMaster Pro transmission company.

Customer Service Context:
- You help company staff apply customer credits to invoices
- Credits are earned from previous purchases and have expiry dates
- Staff requests: "Apply $500 credit to invoice INV001 for John Smith"
- Available customers: CUST001 (John Smith), CUST002 (Sarah Johnson), CUST003 (Mike Wilson)
- Available invoices: INV001, INV002, INV003, INV004

User message: "${message}"

Provide helpful responses for:
- Credit applications: Guide staff on proper format
- Credit inquiries: Show available credits and balances
- Invoice questions: Provide invoice details
- General help: Explain credit system and procedures

Keep responses professional and focused on customer service operations.`;

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

// Fallback processing if Ollama fails
async function fallbackProcessing(message) {
  const lowerMessage = message.toLowerCase();

  // Extract information from the message using regex
  const invoiceMatch = message.match(/inv\w*\s*[:#]?\s*(\w+)/i);
  const customerMatch = message.match(/(cust\w*|cst\w*)\s*[:#]?\s*(\w+)/i);
  const creditMatch = message.match(/(\$?\d+(?:\.\d{2})?)\s*credit|credit\s*[:#]?\s*\$?(\d+(?:\.\d{2})?)/i);
  const amountMatch = message.match(/\$(\d+(?:\.\d{2})?)/);

  // Also check for customer names
  const nameMatch = message.match(/(john\s+smith|sarah\s+johnson|mike\s+wilson)/i);

  console.log('Fallback regex matches:', { invoiceMatch, customerMatch, creditMatch, amountMatch, nameMatch });

  if (invoiceMatch || customerMatch || nameMatch) {
    let invoiceId = invoiceMatch ? invoiceMatch[1].toUpperCase() : null;
    let customerId = null;

    // Extract customer ID
    if (customerMatch) {
      customerId = customerMatch[2].toUpperCase();
      // Fix common customer ID formats
      if (customerId.startsWith('001')) {
        customerId = 'CUST001';
      } else if (customerId.startsWith('002')) {
        customerId = 'CUST002';
      } else if (customerId.startsWith('003')) {
        customerId = 'CUST003';
      } else if (!customerId.startsWith('CUST')) {
        customerId = 'CUST' + customerId;
      }
    } else if (nameMatch) {
      // Convert names to customer IDs
      const name = nameMatch[1].toLowerCase();
      if (name.includes('john')) customerId = 'CUST001';
      else if (name.includes('sarah')) customerId = 'CUST002';
      else if (name.includes('mike')) customerId = 'CUST003';
    }

    let creditAmount = 0;
    if (creditMatch) {
      creditAmount = parseFloat(creditMatch[1] || creditMatch[2]);
    } else if (amountMatch) {
      creditAmount = parseFloat(amountMatch[1]);
    }

    console.log('Fallback extracted:', { invoiceId, customerId, creditAmount });

    // Determine intent based on message content
    const isApplyingCredits = lowerMessage.includes('apply') || lowerMessage.includes('use') || creditAmount > 0;

    if (isApplyingCredits && creditAmount > 0) {
      // Credit application - need all three pieces of info
      if (!customerId || !invoiceId) {
        return {
          message: `❌ Incomplete Credit Application\n\n` +
                  `To apply credits, please provide:\n` +
                  `• Customer ID or name\n` +
                  `• Invoice ID\n` +
                  `• Credit amount\n\n` +
                  `Example: "Apply $500 credit to invoice INV001 for John Smith"`,
          type: 'error'
        };
      }
      return await validateCredits(invoiceId, customerId, creditAmount);
    } else {
      // Invoice inquiry - just checking details
      return await handleInvoiceInquiry(invoiceId, customerId);
    }
  }

  // Default responses for common queries
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return {
      message: 'Hello! I\'m here to help you with invoice inquiries, credit validation, account information, and general questions. What can I assist you with today?',
      type: 'greeting'
    };
  }

  if (lowerMessage.includes('help')) {
    return {
      message: 'I can help you with:\n• Invoice inquiries\n• Credit validation\n• Account information\n• General questions\n\nJust tell me what you need assistance with in your own words!',
      type: 'help'
    };
  }

  return {
    message: 'I can help you with invoice inquiries, credit validation, and account information. Could you please tell me what you need assistance with?',
    type: 'clarification'
  };
}

// Credit Validation Function
async function validateCredits(invoiceId, customerId, creditAmount) {
  try {
    console.log('validateCredits called with:', { invoiceId, customerId, creditAmount });
    console.log('Available customers:', mockDatabase.customers.map(c => c.id));
    console.log('Available invoices:', mockDatabase.invoices.map(i => i.id));

    // Find customer
    let customer = null;
    if (customerId) {
      customer = mockDatabase.customers.find(c => c.id === customerId);
      console.log('Found customer by ID:', customer);
    } else if (invoiceId) {
      const invoice = mockDatabase.invoices.find(i => i.id === invoiceId);
      console.log('Found invoice:', invoice);
      if (invoice) {
        customer = mockDatabase.customers.find(c => c.id === invoice.customerId);
        console.log('Found customer by invoice:', customer);
        customerId = customer?.id; // Set customerId for later use
      }
    }

    if (!customer) {
      return {
        message: `Customer not found. Available customers: CUST001 (John Smith), CUST002 (Sarah Johnson). You provided: ${customerId || 'none'}`,
        type: 'error'
      };
    }

    // Find invoice
    let invoice = null;
    if (invoiceId) {
      invoice = mockDatabase.invoices.find(i => i.id === invoiceId);
    } else {
      // If no specific invoice, find the most recent pending invoice for the customer
      const customerInvoices = mockDatabase.invoices.filter(i => i.customerId === customer.id && i.status === 'pending');
      invoice = customerInvoices.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    }

    if (!invoice) {
      const customerInvoices = mockDatabase.invoices.filter(i => i.customerId === customer.id);
      return {
        message: `Invoice not found. Available invoices for ${customer.name}: ${customerInvoices.map(i => `${i.id} ($${i.currentAmount})`).join(', ')}`,
        type: 'error'
      };
    }

    // Calculate available credits (only active and non-expired)
    const now = new Date();
    const activeCredits = customer.credits.filter(c =>
      c.status === 'active' && new Date(c.expiryDate) > now
    );
    const totalAvailableCredits = activeCredits.reduce((sum, credit) => sum + credit.amount, 0);

    // If no credit amount specified, show available credits and invoice details
    if (!creditAmount || creditAmount === 0) {
      return {
        message: ` Credit Information for ${customer.name}:\n\n` +
                ` Invoice ${invoice.id}: $${invoice.currentAmount} (Original: $${invoice.originalAmount})\n` +
                ` Available Credits: $${totalAvailableCredits}\n\n` +
                `Active Credits:\n${activeCredits.map(c => `• $${c.amount} (expires ${c.expiryDate}) - ${c.description}`).join('\n')}\n\n` +
                `To apply credits, specify the amount you want to use.`,
        type: 'info',
        details: {
          customerId: customer.id,
          customerName: customer.name,
          invoiceId: invoice.id,
          invoiceAmount: invoice.currentAmount,
          availableCredits: totalAvailableCredits,
          activeCredits: activeCredits
        }
      };
    }

    // Validate credit amount
    if (creditAmount > totalAvailableCredits) {
      return {
        message: `❌ Insufficient Credits\n\n` +
                `Customer: ${customer.name} (${customer.id})\n` +
                `Requested: $${creditAmount}\n` +
                `Available: $${totalAvailableCredits}\n\n` +
                `Available Credits:\n${activeCredits.map(c => `• $${c.amount} (expires ${c.expiryDate})`).join('\n')}\n\n` +
                `Cannot apply credits - insufficient balance.`,
        type: 'error'
      };
    }

    if (creditAmount > invoice.currentAmount) {
      return {
        message: `❌ Credit Amount Exceeds Invoice\n\n` +
                `Customer: ${customer.name}\n` +
                `Invoice: ${invoice.id} - $${invoice.currentAmount}\n` +
                `Requested Credit: $${creditAmount}\n\n` +
                `Cannot apply $${creditAmount} credits to a $${invoice.currentAmount} invoice.\n` +
                `Maximum applicable: $${invoice.currentAmount}`,
        type: 'error'
      };
    }

    // Apply credits to invoice (simulate the transaction)
    const newInvoiceAmount = invoice.currentAmount - creditAmount;
    const newCreditsApplied = invoice.creditsApplied + creditAmount;

    // Update invoice (in real system, this would be a database transaction)
    invoice.currentAmount = newInvoiceAmount;
    invoice.creditsApplied = newCreditsApplied;

    // Deduct credits from customer (FIFO - First In, First Out)
    let remainingToDeduct = creditAmount;

    for (const credit of activeCredits) {
      if (remainingToDeduct <= 0) break;

      if (credit.amount <= remainingToDeduct) {
        // Use entire credit
        remainingToDeduct -= credit.amount;
        credit.amount = 0;
        credit.status = 'used';
      } else {
        // Partial use of credit
        credit.amount -= remainingToDeduct;
        remainingToDeduct = 0;
      }
    }

    // Calculate remaining credits after application
    const remainingCredits = customer.credits
      .filter(c => c.status === 'active' && new Date(c.expiryDate) > now)
      .reduce((sum, credit) => sum + credit.amount, 0);

    return {
      message: `✅ Credits Applied Successfully!\n\n` +
              `Customer: ${customer.name} (${customer.id})\n` +
              `Invoice: ${invoice.id}\n` +
              `Credits Applied: $${creditAmount}\n` +
              `New Invoice Amount: $${newInvoiceAmount}\n\n` +
              `📧 A new invoice with applied credit discount will be sent to ${customer.email} for payment.\n\n` +
              `${newInvoiceAmount > 0 ? `Outstanding Balance: $${newInvoiceAmount}` : '🎉 Invoice fully paid with credits!'}`,
      type: 'success',
      details: {
        invoiceId: invoice.id,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        originalAmount: invoice.originalAmount,
        creditApplied: creditAmount,
        newInvoiceAmount: newInvoiceAmount,
        remainingCredits: remainingCredits,
        fullyPaid: newInvoiceAmount === 0
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

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Transmission Portal API is running!' });
});

// API endpoint to get all customers with credit summary (for testing)
app.get('/api/customers', (req, res) => {
  const customerSummary = mockDatabase.customers.map(customer => {
    const now = new Date();
    const activeCredits = customer.credits.filter(c =>
      c.status === 'active' && new Date(c.expiryDate) > now
    );
    const totalActiveCredits = activeCredits.reduce((sum, credit) => sum + credit.amount, 0);

    const customerInvoices = mockDatabase.invoices.filter(i => i.customerId === customer.id);

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      totalActiveCredits: totalActiveCredits,
      activeCreditsCount: activeCredits.length,
      totalCredits: customer.credits.length,
      pendingInvoices: customerInvoices.filter(i => i.status === 'pending').length,
      totalInvoices: customerInvoices.length
    };
  });

  res.json({
    customers: customerSummary,
    totalCustomers: customerSummary.length
  });
});

// Export mock database for use in routes
app.locals.mockDatabase = mockDatabase;

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
