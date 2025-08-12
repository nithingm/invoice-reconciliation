/**
 * PYTHON SERVICE - Microservice Integration
 * =========================================
 * 
 * Handles all communication with the Python microservice:
 * - Credit validation and calculations
 * - Invoice processing and updates
 * - Credit memo generation
 * - Partial payment processing
 * - Purchase history compilation
 */

const { spawn } = require('child_process');
const path = require('path');

/**
 * Call Python microservice for complex business logic calculations
 * 
 * The Python microservice handles:
 * - Credit validation and calculations
 * - Invoice processing and updates
 * - Credit memo generation
 * - Partial payment processing with credit deduction
 * - Purchase history compilation
 * 
 * @param {string} action - The action to perform (e.g., 'credit_application', 'partial_payment')
 * @param {object} data - Data to send to the Python service
 * @returns {Promise<object>} - Result from Python microservice
 */
async function callPythonMicroservice(action, data) {
  try {
    // Path to the Python credit validation script
    const pythonScript = path.join(__dirname, '..', '..', 'python_microservice', 'credit_validator.py');
    
    // Prepare input data for Python script
    const inputData = JSON.stringify({
      action: action,
      ...data
    });

    console.log('🐍 Calling Python microservice with:', {
      action,
      ...data
    });

    // Execute Python script and return promise
    return new Promise((resolve) => {
      const python = spawn('python', [pythonScript, inputData]);
      let stdout = '';
      let stderr = '';

      // Collect stdout data
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // Collect stderr data
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle process completion
      python.on('close', (code) => {
        if (code !== 0) {
          console.error('🐍 Python microservice error:', stderr);
          resolve({ error: `Python process exited with code ${code}: ${stderr}` });
          return;
        }

        try {
          // Parse JSON response from Python
          const result = JSON.parse(stdout.trim());
          console.log('🐍 Python microservice success:', result);
          resolve(result);
        } catch (parseError) {
          console.error('🐍 Python output parse error:', parseError, 'Output:', stdout);
          resolve({ error: `Failed to parse Python output: ${parseError.message}` });
        }
      });

      // Handle spawn errors
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

/**
 * Specific Python service calls for different business operations
 */

/**
 * Apply credits to customer invoice
 */
async function applyCreditToInvoice(customerId, customerName, creditAmount, invoiceId, mockData) {
  return await callPythonMicroservice('apply', {
    customer_id: customerId,
    customer_name: customerName,
    credit_amount: creditAmount,
    invoice_id: invoiceId,
    mock_data: mockData
  });
}

/**
 * Get customer credit balance
 */
async function getCustomerCreditBalance(customerId, customerName, mockData) {
  return await callPythonMicroservice('balance', {
    customer_id: customerId,
    customer_name: customerName,
    mock_data: mockData
  });
}

/**
 * Get customer purchase history
 */
async function getCustomerPurchaseHistory(customerId, customerName, mockData) {
  return await callPythonMicroservice('history', {
    customer_id: customerId,
    customer_name: customerName,
    mock_data: mockData
  });
}

/**
 * Process quantity discrepancy
 */
async function processQuantityDiscrepancy(customerId, customerName, invoiceId, missingQuantity, itemDescription, mockData) {
  return await callPythonMicroservice('quantity_discrepancy', {
    customer_id: customerId,
    customer_name: customerName,
    invoice_id: invoiceId,
    missing_quantity: missingQuantity,
    item_description: itemDescription,
    mock_data: mockData
  });
}

/**
 * Process damage report
 */
async function processDamageReport(customerId, customerName, invoiceId, damageDescription, mockData) {
  return await callPythonMicroservice('damage_report', {
    customer_id: customerId,
    customer_name: customerName,
    invoice_id: invoiceId,
    damage_description: damageDescription,
    mock_data: mockData
  });
}

/**
 * Process partial payment with credit deduction
 */
async function processPartialPayment(customerId, customerName, invoiceId, paidAmount, invoiceAmount, mockData) {
  return await callPythonMicroservice('partial_payment', {
    customer_id: customerId,
    customer_name: customerName,
    invoice_id: invoiceId,
    paid_amount: paidAmount,
    invoice_amount: invoiceAmount,
    mock_data: mockData
  });
}

/**
 * Approve credit memo
 */
async function approveCreditMemo(creditMemoId, customerChoice, targetInvoiceId, mockData) {
  return await callPythonMicroservice('approve_credit_memo', {
    credit_memo_id: creditMemoId,
    customer_choice: customerChoice,
    target_invoice_id: targetInvoiceId,
    mock_data: mockData
  });
}

module.exports = {
  callPythonMicroservice,
  applyCreditToInvoice,
  getCustomerCreditBalance,
  getCustomerPurchaseHistory,
  processQuantityDiscrepancy,
  processDamageReport,
  processPartialPayment,
  approveCreditMemo
};
