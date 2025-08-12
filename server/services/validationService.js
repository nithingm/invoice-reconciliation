/**
 * VALIDATION SERVICE - Customer & Data Validation
 * ===============================================
 * 
 * Handles validation of customer names, IDs, and provides helpful suggestions
 * when validation fails.
 */

const database = require('../data/database');

/**
 * Validate customer and provide helpful error messages
 * 
 * @param {string} customerName - Customer name to validate
 * @param {string} customerId - Customer ID to validate
 * @returns {object} - Validation result with customer info or error details
 */
function validateCustomer(customerName, customerId) {
  // If we have a customer ID, validate it
  if (customerId) {
    const customer = database.getCustomerById(customerId);
    if (customer) {
      return {
        isValid: true,
        customer: customer,
        message: `Customer validated: ${customer.name} (${customer.id})`
      };
    } else {
      return {
        isValid: false,
        error: 'CUSTOMER_ID_NOT_FOUND',
        message: ` Customer ID '${customerId}' not found.`,
        suggestions: getCustomerSuggestions()
      };
    }
  }

  // If we have a customer name, validate it
  if (customerName) {
    const customer = database.getCustomerByName(customerName);
    if (customer) {
      return {
        isValid: true,
        customer: customer,
        message: `Customer validated: ${customer.name} (${customer.id})`
      };
    } else {
      // Customer not found - provide helpful suggestions
      const suggestions = findSimilarCustomers(customerName);
      return {
        isValid: false,
        error: 'CUSTOMER_NAME_NOT_FOUND',
        message: ` Customer '${customerName}' not found.`,
        suggestions: suggestions,
        allCustomers: getCustomerSuggestions()
      };
    }
  }

  // No customer information provided
  return {
    isValid: false,
    error: 'MISSING_CUSTOMER_INFO',
    message: ' Please provide a customer name or ID.',
    suggestions: getCustomerSuggestions()
  };
}

/**
 * Find customers with similar names using fuzzy matching
 * 
 * @param {string} searchName - Name to search for
 * @returns {array} - Array of similar customer names
 */
function findSimilarCustomers(searchName) {
  const customers = database.customers;
  const searchLower = searchName.toLowerCase();
  
  const similarities = customers.map(customer => {
    const nameLower = customer.name.toLowerCase();
    const similarity = calculateSimilarity(searchLower, nameLower);
    return {
      customer: customer,
      similarity: similarity
    };
  });

  // Return customers with similarity > 0.3, sorted by similarity
  return similarities
    .filter(item => item.similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3) // Top 3 matches
    .map(item => ({
      name: item.customer.name,
      id: item.customer.id,
      company: item.customer.company
    }));
}

/**
 * Calculate similarity between two strings (simple Levenshtein-based)
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Get list of all customers for suggestions
 * 
 * @returns {array} - Array of customer suggestions
 */
function getCustomerSuggestions() {
  return database.customers.map(customer => ({
    name: customer.name,
    id: customer.id,
    company: customer.company
  }));
}

/**
 * Format customer validation error message
 * 
 * @param {object} validationResult - Result from validateCustomer
 * @returns {string} - Formatted error message
 */
function formatCustomerValidationError(validationResult) {
  let message = validationResult.message + '\n\n';
  
  if (validationResult.suggestions && validationResult.suggestions.length > 0) {
    message += ' **Did you mean:**\n';
    validationResult.suggestions.forEach(suggestion => {
      message += `• ${suggestion.name} (${suggestion.id}) - ${suggestion.company}\n`;
    });
    message += '\n';
  }
  
  if (validationResult.allCustomers) {
    message += 'Available customers:\n';
    validationResult.allCustomers.forEach(customer => {
      message += `• ${customer.name} (${customer.id})\n`;
    });
  }
  
  return message;
}

/**
 * Validate invoice ownership
 * 
 * @param {string} invoiceId - Invoice ID to validate
 * @param {string} customerId - Customer ID to check ownership
 * @returns {object} - Validation result
 */
function validateInvoiceOwnership(invoiceId, customerId) {
  const invoice = database.getInvoiceById(invoiceId);
  
  if (!invoice) {
    return {
      isValid: false,
      error: 'INVOICE_NOT_FOUND',
      message: ` Invoice '${invoiceId}' not found.`
    };
  }
  
  if (invoice.customerId !== customerId) {
    const actualCustomer = database.getCustomerById(invoice.customerId);
    return {
      isValid: false,
      error: 'INVOICE_OWNERSHIP_MISMATCH',
      message: ` Invoice '${invoiceId}' belongs to ${actualCustomer.name}, not the specified customer.`,
      actualOwner: actualCustomer
    };
  }
  
  return {
    isValid: true,
    invoice: invoice,
    message: ` Invoice ownership validated`
  };
}

module.exports = {
  validateCustomer,
  findSimilarCustomers,
  formatCustomerValidationError,
  validateInvoiceOwnership,
  getCustomerSuggestions
};
