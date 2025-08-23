const axios = require('axios');
const API_URL = 'http://localhost:5001';

async function callPythonService(endpoint, data) {
    try {
        const response = await axios.post(`${API_URL}${endpoint}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error calling python service at ${endpoint}`, error);
        return { error: error.message };
    }
}

async function applyCreditToInvoice(customerId, customerName, creditAmount, invoiceId) {
    return await callPythonService('/credit/apply', {
        customer_id: customerId,
        customer_name: customerName,
        credit_amount: creditAmount,
        invoice_id: invoiceId
    });
}

async function getCustomerCreditBalance(customerId, customerName) {
    return await callPythonService('/credit/balance', {
        customer_id: customerId,
        customer_name: customerName
    });
}

async function getCustomerPurchaseHistory(customerId, customerName) {
    return await callPythonService('/purchase/history', {
        customer_id: customerId,
        customer_name: customerName
    });
}

async function processQuantityDiscrepancy(customerId, customerName, invoiceId, missingQuantity, itemDescription) {
    return await callPythonService('/discrepancy/quantity', {
        customer_id: customerId,
        customer_name: customerName,
        invoice_id: invoiceId,
        missing_quantity: missingQuantity,
        item_description: itemDescription
    });
}

async function processDamageReport(customerId, customerName, invoiceId, damageDescription) {
    return await callPythonService('/discrepancy/damage', {
        customer_id: customerId,
        customer_name: customerName,
        invoice_id: invoiceId,
        damage_description: damageDescription
    });
}

async function processPartialPayment(customerId, customerName, invoiceId, paidAmount, invoiceAmount) {
    return await callPythonService('/payment/partial', {
        customer_id: customerId,
        customer_name: customerName,
        invoice_id: invoiceId,
        paid_amount: paidAmount,
        invoice_amount: invoiceAmount
    });
}

async function approveCreditMemo(creditMemoId, customerChoice, targetInvoiceId) {
    return await callPythonService('/credit_memo/approve', {
        credit_memo_id: creditMemoId,
        customer_choice: customerChoice,
        target_invoice_id: targetInvoiceId
    });
}

module.exports = {
    applyCreditToInvoice,
    getCustomerCreditBalance,
    getCustomerPurchaseHistory,
    processQuantityDiscrepancy,
    processDamageReport,
    processPartialPayment,
    approveCreditMemo
};
