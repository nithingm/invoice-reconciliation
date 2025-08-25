/**
 * CLARIFYING RAG AGENT - Orchestrator Service
 * ==========================================
 * 
 * This is the heart of the system that manages the entire lifecycle of user requests.
 * It uses LLM as its "brain" and a library of tools to interact with the database.
 * 
 * Core Workflow:
 * 1. Analyze user intent and select appropriate tool
 * 2. Execute retrieval tools to gather data
 * 3. Detect ambiguity and generate clarifying questions
 * 4. Confirm actions before executing write operations
 */

const { extractInfoWithLLM } = require('./aiService');
const retrievalTools = require('./tools/retrievalTools');
const actionTools = require('./tools/actionTools');
const { generateClarificationQuestion, generateConfirmationPrompt } = require('../config/agentPrompts');

/**
 * Agent states for managing conversation flow
 */
const AGENT_STATES = {
  ANALYZING: 'analyzing',
  WAITING_FOR_CLARIFICATION: 'waiting_for_clarification',
  WAITING_FOR_CONFIRMATION: 'waiting_for_confirmation',
  EXECUTING: 'executing',
  COMPLETED: 'completed'
};

/**
 * Helper function to format details as collapsible section
 */
function formatCollapsibleDetails(details, title = "📋 Technical Details") {
  if (!details) return '';

  const detailsJson = JSON.stringify(details, null, 2);
  return `\n---DETAILS---\n${detailsJson}`;
}

/**
 * Helper function to keep bold markdown as-is (frontend will handle **)
 */
function formatBoldText(text) {
  // Keep markdown format - frontend will render ** as bold
  return text;
}

/**
 * Main Agent class that orchestrates the entire request lifecycle
 */
class ClarifyingRAGAgent {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.state = AGENT_STATES.ANALYZING;
    this.context = {
      originalRequest: null,
      selectedTool: null,
      toolArguments: null,
      retrievalResults: null,
      confirmedData: null,
      pendingAction: null
    };
  }

  /**
   * Main entry point for processing user requests
   */
  async processRequest(userMessage, model = 'gemini-2.5-flash-lite', conversationContext = null) {
    try {
      console.log(`🤖 Agent processing: "${userMessage}" (State: ${this.state})`);

      switch (this.state) {
        case AGENT_STATES.ANALYZING:
          return await this.analyzeAndRetrieve(userMessage, model, conversationContext);
        
        case AGENT_STATES.WAITING_FOR_CLARIFICATION:
          return await this.handleClarification(userMessage, model);
        
        case AGENT_STATES.WAITING_FOR_CONFIRMATION:
          return await this.handleConfirmation(userMessage, model);
        
        default:
          return this.resetAndAnalyze(userMessage, model, conversationContext);
      }
    } catch (error) {
      console.error('❌ Agent error:', error);
      this.reset();
      return {
        message: '🔴 I encountered an error processing your request. Please try again.',
        type: 'error',
        agentState: this.state
      };
    }
  }

  /**
   * Pattern-based extraction as fallback when LLM fails
   */
  patternBasedExtraction(message) {
    const lowerMessage = message.toLowerCase();
    const result = {
      intent: 'general',
      customerName: null,
      customerId: null,
      creditAmount: null,
      invoiceId: null,
      itemDescription: null,
      damageDescription: null,
      customerChoice: null,
      targetInvoiceId: null,
      missingQuantity: null
    };

    // Extract customer ID (CUST001, CUST002, etc.)
    const custMatch = message.match(/CUST\d+/i);
    if (custMatch) {
      result.customerId = custMatch[0].toUpperCase();
    }

    // Extract invoice ID (INV001, INV002, etc.)
    const invMatch = message.match(/INV\d+/i);
    if (invMatch) {
      result.invoiceId = invMatch[0].toUpperCase();
    }

    // Extract credit amount ($5, $250, 100, etc.) - only if explicitly mentioned
    // Be more specific to avoid extracting from invoice IDs like INV008
    const amountMatch = message.match(/\$(\d+)|(\d+)\s*(?:credit|dollar)|apply\s+(\d+)|credit.*?(\d+)(?!\d)/i);
    if (amountMatch) {
      // Get the first non-null capture group, but avoid invoice ID numbers
      const amount = amountMatch[1] || amountMatch[2] || amountMatch[3] || amountMatch[4];
      if (amount) {
        // Additional validation: don't extract if it's part of an invoice ID
        const invoicePattern = new RegExp(`INV\\d*${amount}`, 'i');
        if (!invoicePattern.test(message)) {
          result.creditAmount = parseInt(amount);
        }
      }
    }

    // Determine intent based on keywords - PRIORITIZE COMMON INTENTS
    if ((lowerMessage.includes('balance') || lowerMessage.includes('show') || lowerMessage.includes('check') || lowerMessage.includes('what')) && lowerMessage.includes('credit')) {
      result.intent = 'credit_balance_inquiry';
    } else if (lowerMessage.includes('apply') && lowerMessage.includes('credit')) {
      result.intent = 'credit_application';
    } else if ((lowerMessage.includes('add') || lowerMessage.includes('give') || lowerMessage.includes('create')) && lowerMessage.includes('credit')) {
      result.intent = 'add_credits';
    } else if (lowerMessage.includes('invoice') && !lowerMessage.includes('credit')) {
      result.intent = 'invoice_inquiry';
    } else if (lowerMessage.includes('history') || lowerMessage.includes('purchase')) {
      result.intent = 'purchase_history';
    }
    // RESTRICT ACCESS TO SPECIALIZED INTENTS - only if very specific keywords are present
    else if (lowerMessage.includes('missing') && lowerMessage.includes('quantity') && lowerMessage.includes('received')) {
      result.intent = 'quantity_discrepancy';
    } else if (lowerMessage.includes('damaged') && (lowerMessage.includes('broken') || lowerMessage.includes('defective'))) {
      result.intent = 'damage_report';
    }

    // VALIDATION: Ensure intent makes sense with extracted data
    if (result.intent === 'quantity_discrepancy' && !result.invoiceId) {
      // Quantity discrepancy requires an invoice ID
      console.log('🔧 LIVE DEBUG - Rejecting quantity_discrepancy without invoice ID');
      result.intent = 'general';
    }

    if (result.intent === 'credit_balance_inquiry' && !result.customerId) {
      // Credit balance inquiry requires a customer
      console.log('🔧 LIVE DEBUG - Rejecting credit_balance_inquiry without customer');
      result.intent = 'general';
    }

    console.log('🔧 LIVE DEBUG - Pattern extraction details:', {
      custMatch: custMatch?.[0],
      invMatch: invMatch?.[0],
      amountMatch: amountMatch?.[1],
      detectedIntent: result.intent,
      validationPassed: result.intent !== 'general'
    });

    return result;
  }

  /**
   * Check if the current request involves a different customer than previous context
   */
  checkForCustomerChange(extractedInfo) {
    const { customerName, customerId } = extractedInfo;
    // Handle "null" strings from LLM extraction
    const cleanCustomerName = (customerName === 'null' || customerName === null) ? null : customerName;
    const cleanCustomerId = (customerId === 'null' || customerId === null) ? null : customerId;
    const currentCustomerIdentifier = cleanCustomerName || cleanCustomerId;

    console.log('🔍 LIVE DEBUG - Customer change check:', {
      currentCustomerIdentifier,
      hasConfirmedData: !!this.context.confirmedData,
      confirmedDataType: Array.isArray(this.context.confirmedData) ? 'array' : typeof this.context.confirmedData
    });

    if (!currentCustomerIdentifier) return false;

    // Check if we have previous customer data
    if (this.context.confirmedData && Array.isArray(this.context.confirmedData) && this.context.confirmedData.length > 0) {
      const previousCustomer = this.context.confirmedData[0];
      const previousIdentifier = previousCustomer.name || previousCustomer.id;

      console.log('🔍 LIVE DEBUG - Previous customer:', {
        name: previousCustomer.name,
        id: previousCustomer.id,
        identifier: previousIdentifier
      });

      // If customer identifier is different, clear previous context
      if (currentCustomerIdentifier !== previousIdentifier &&
          currentCustomerIdentifier !== previousCustomer.id &&
          currentCustomerIdentifier !== previousCustomer.name) {
        console.log(`🔄 LIVE DEBUG - Customer change detected: ${previousIdentifier} → ${currentCustomerIdentifier}`);
        console.log('🧹 LIVE DEBUG - Clearing previous customer context');
        this.context.confirmedData = null;
        return true;
      } else {
        console.log('🔍 LIVE DEBUG - Same customer, keeping context');
      }
    } else {
      console.log('🔍 LIVE DEBUG - No previous customer data');
    }

    return false;
  }

  /**
   * Step 1: Analyze intent and execute retrieval tools
   */
  async analyzeAndRetrieve(userMessage, model, conversationContext) {
    this.context.originalRequest = userMessage;

    // Check for reset command
    if (userMessage.toLowerCase().includes('reset session') || userMessage.toLowerCase().includes('clear session')) {
      console.log('🔄 LIVE DEBUG - Session reset requested');
      this.reset();
      return {
        message: '🔄 **Session Reset**\n\nI\'ve cleared all session data. You can now start fresh with your queries.',
        type: 'info',
        agentState: 'completed'
      };
    }

    console.log('🔍 LIVE DEBUG - Session:', this.sessionId);
    console.log('🔍 LIVE DEBUG - Message:', userMessage);
    console.log('🔍 LIVE DEBUG - Current context before extraction:', {
      confirmedData: this.context.confirmedData ?
        (Array.isArray(this.context.confirmedData) ? this.context.confirmedData[0]?.name : this.context.confirmedData.name) : 'null'
    });

    // Use existing LLM to extract intent and parameters
    let extractedInfo = await extractInfoWithLLM(userMessage, model, conversationContext);

    console.log('🧠 Extracted info:', extractedInfo);

    // ROBUST FALLBACK: If LLM extraction fails or returns general intent, use pattern matching
    if (extractedInfo.intent === 'general' || extractedInfo.error ||
        (extractedInfo.customerId === 'null' || extractedInfo.customerId === null) && userMessage.match(/CUST\d+/i)) {
      console.log('🔧 LIVE DEBUG - LLM extraction failed or incomplete, using pattern-based fallback');
      console.log('🔧 LIVE DEBUG - Original LLM result:', extractedInfo);
      extractedInfo = this.patternBasedExtraction(userMessage);
      console.log('🔧 LIVE DEBUG - Pattern-based result:', extractedInfo);
    }

    // VALIDATION: Check for LLM hallucination and wrong intent classification
    const originalMessage = userMessage.toLowerCase();

    // Check for hallucinated customer names
    if (extractedInfo.customerName && extractedInfo.customerName !== 'null') {
      const extractedName = extractedInfo.customerName.toLowerCase();

      if (!originalMessage.includes(extractedName)) {
        console.log('🚨 LIVE DEBUG - LLM hallucination detected:', {
          extractedName: extractedInfo.customerName,
          originalMessage: userMessage,
          containsName: originalMessage.includes(extractedName)
        });

        // Clear the hallucinated customer name but preserve customerId if it exists
        extractedInfo.customerName = null;
        console.log('🧹 LIVE DEBUG - Cleared hallucinated customer name');

        // If we have a customerId from the original message, use pattern extraction to get it
        if (!extractedInfo.customerId) {
          const custMatch = userMessage.match(/CUST\d+/i);
          if (custMatch) {
            extractedInfo.customerId = custMatch[0].toUpperCase();
            console.log('🔧 LIVE DEBUG - Recovered customerId from pattern:', extractedInfo.customerId);
          }
        }
      }
    }

    // CRITICAL: Validate intent classification
    if (extractedInfo.intent === 'quantity_discrepancy') {
      // Quantity discrepancy requires very specific keywords
      if (!originalMessage.includes('missing') || !originalMessage.includes('quantity') || !originalMessage.includes('received')) {
        console.log('🚨 LIVE DEBUG - Wrong quantity_discrepancy classification, correcting to credit_balance_inquiry');
        extractedInfo.intent = 'credit_balance_inquiry';
      }
    }

    if (extractedInfo.intent === 'damage_report') {
      // Damage report requires damage-related keywords
      if (!originalMessage.includes('damaged') && !originalMessage.includes('broken') && !originalMessage.includes('defective')) {
        console.log('🚨 LIVE DEBUG - Wrong damage_report classification, correcting to credit_balance_inquiry');
        extractedInfo.intent = 'credit_balance_inquiry';
      }
    }

    // Store extracted info for later use
    this.context.originalExtractedInfo = extractedInfo;

    // Check for customer change and clear context if needed
    this.checkForCustomerChange(extractedInfo);

    // AGGRESSIVE FIX: Always clear context when a specific customer is mentioned
    // This ensures no session contamination
    const cleanCustomerName = (extractedInfo.customerName === 'null' || extractedInfo.customerName === null) ? null : extractedInfo.customerName;
    const cleanCustomerId = (extractedInfo.customerId === 'null' || extractedInfo.customerId === null) ? null : extractedInfo.customerId;

    if (cleanCustomerName || cleanCustomerId) {
      console.log('🔄 LIVE DEBUG - Aggressive context clearing for customer query');
      this.context.confirmedData = null;
    }

    // Determine which retrieval tool to use based on intent
    const toolSelection = this.selectRetrievalTool(extractedInfo);
    console.log('🔍 Tool selection result:', toolSelection);

    if (!toolSelection) {
      console.log('🔍 No tool selection - taking direct path');

      // For read-only operations that need customer data, try to find customer first
      const cleanCustomerName = (extractedInfo.customerName === 'null' || extractedInfo.customerName === null) ? null : extractedInfo.customerName;
      const cleanCustomerId = (extractedInfo.customerId === 'null' || extractedInfo.customerId === null) ? null : extractedInfo.customerId;

      if (this.isReadOnlyOperation(extractedInfo.intent) && (cleanCustomerName || cleanCustomerId)) {
        console.log('🔍 Read-only operation needs customer - finding customer first');
        const customerName = cleanCustomerName || cleanCustomerId;
        const customers = await retrievalTools.findCustomerByName(customerName);

        if (customers.length === 0) {
          return {
            message: `🔴 Customer not found. Please check the customer name or ID.`,
            type: 'error',
            agentState: 'completed'
          };
        }

        // Store customer data and execute
        this.context.confirmedData = customers;
        return await this.executeDirectly(extractedInfo);
      }

      // For read-only operations without customer data, execute directly
      if (this.isReadOnlyOperation(extractedInfo.intent)) {
        console.log('🔍 Read-only operation - executing directly without retrieval');
        return await this.executeDirectly(extractedInfo);
      }

      // For write operations, proceed to action confirmation
      // But first check if this is a failed intent extraction
      if (extractedInfo.intent === 'general' && extractedInfo.error) {
        console.log('🔍 Intent extraction failed, attempting to parse manually');
        // Try to manually detect credit application patterns
        const message = this.context.originalRequest.toLowerCase();
        if (message.includes('apply') && message.includes('credit') && (message.includes('cust') || message.includes('invoice'))) {
          console.log('🔍 Detected credit application pattern, switching intent');
          extractedInfo.intent = 'credit_application';

          // Try to extract basic info manually
          const custMatch = this.context.originalRequest.match(/CUST\d+/i);
          const invMatch = this.context.originalRequest.match(/INV\d+/i);
          const amountMatch = this.context.originalRequest.match(/\$?(\d+)/);

          if (custMatch) extractedInfo.customerId = custMatch[0].toUpperCase();
          if (invMatch) extractedInfo.invoiceId = invMatch[0].toUpperCase();
          if (amountMatch) extractedInfo.creditAmount = parseInt(amountMatch[1]);

          console.log('🔍 Manual extraction result:', extractedInfo);

          // If we have customer data and specific invoice, execute directly for validation
          if (this.context.confirmedData && extractedInfo.invoiceId) {
            console.log('🔍 Manual extraction with specific invoice - executing directly for validation');
            return await this.executeDirectly(extractedInfo);
          }
        }
      }

      return await this.prepareActionConfirmation(extractedInfo);
    }

    // Execute the retrieval tool
    const retrievalResults = await this.executeRetrievalTool(toolSelection);

    console.log(`🔍 Retrieval results:`, retrievalResults);
    console.log(`🔍 Retrieval results length:`, Array.isArray(retrievalResults) ? retrievalResults.length : 'not array');

    // IMMEDIATE VALIDATION: If this is a credit application with specific invoice, validate it now
    if (extractedInfo.intent === 'credit_application' && extractedInfo.invoiceId && retrievalResults && retrievalResults.length > 0) {
      console.log('🔍 IMMEDIATE VALIDATION - Checking invoice before confirmation');
      const customer = Array.isArray(retrievalResults) ? retrievalResults[0] : retrievalResults;
      const invoiceValidation = await retrievalTools.findAndValidateInvoice(extractedInfo.invoiceId, customer.id);

      if (!invoiceValidation.success) {
        console.log('🔍 IMMEDIATE VALIDATION - Invoice validation failed:', invoiceValidation);

        let message = `🔴 **Invoice Issue**\n\n`;
        message += `👤 **Customer:** ${customer.name} (${customer.id})\n`;
        message += `📄 **Invoice:** ${extractedInfo.invoiceId}\n`;
        message += `❌ **Error:** ${invoiceValidation.error}\n\n`;

        if (invoiceValidation.type === 'invoice_not_found') {
          message += `Invoice ${extractedInfo.invoiceId} does not exist in the system.`;
        } else if (invoiceValidation.type === 'invoice_not_owned') {
          message += `Invoice ${extractedInfo.invoiceId} does not belong to ${customer.name}.`;
        } else if (invoiceValidation.type === 'invoice_already_paid') {
          message += `Invoice ${extractedInfo.invoiceId} is already paid.`;
        }

        message = formatBoldText(message);
        message += formatCollapsibleDetails(invoiceValidation, "📄 Invoice Validation Details");

        this.reset();
        return {
          message,
          type: 'error',
          agentState: 'completed'
        };
      }
    }

    // Check for ambiguity
    if (this.detectAmbiguity(retrievalResults)) {
      return await this.generateClarificationQuestion(retrievalResults, extractedInfo);
    }

    // No ambiguity, store confirmed data
    this.context.confirmedData = retrievalResults;

    // For read-only operations, execute directly without confirmation
    if (this.isReadOnlyOperation(extractedInfo.intent)) {
      return await this.executeDirectly(extractedInfo);
    }

    // For credit applications, validate before asking for confirmation
    if (extractedInfo.intent === 'credit_application') {
      return await this.validateAndPrepareConfirmation(extractedInfo);
    }

    // For other write operations, proceed to action confirmation
    return await this.prepareActionConfirmation(extractedInfo);
  }

  /**
   * Check if operation is read-only (doesn't need confirmation)
   */
  isReadOnlyOperation(intent) {
    const readOnlyIntents = [
      'credit_balance_inquiry',
      'purchase_history',
      'invoice_inquiry',
      'overdue_inquiry',
      'payment_history_inquiry'
    ];
    return readOnlyIntents.includes(intent);
  }

  /**
   * Execute read-only operations directly without confirmation
   */
  async executeDirectly(extractedInfo) {
    this.state = AGENT_STATES.EXECUTING;

    try {
      const result = await this.executeAction();
      return result;
    } catch (error) {
      console.error('❌ Direct execution error:', error);
      this.reset();
      return {
        message: `🔴 Error: ${error.message}`,
        type: 'error',
        agentState: this.state
      };
    }
  }

  /**
   * Step 2: Handle user clarification responses
   */
  async handleClarification(userMessage, model) {
    // Parse user's clarification choice
    const selectedItem = this.parseUserChoice(userMessage, this.context.retrievalResults);
    
    if (!selectedItem) {
      return {
        message: "I didn't understand your choice. Please select one of the options I provided.",
        type: 'clarification_needed',
        agentState: this.state
      };
    }

    this.context.confirmedData = selectedItem;
    this.state = AGENT_STATES.WAITING_FOR_CONFIRMATION;

    // Generate confirmation prompt
    return await this.prepareActionConfirmation(this.context.originalExtractedInfo);
  }

  /**
   * Step 3: Handle user confirmation for actions
   */
  async handleConfirmation(userMessage, model) {
    const isConfirmed = this.parseConfirmation(userMessage);
    
    if (!isConfirmed) {
      this.reset();
      return {
        message: "Action cancelled. How else can I help you?",
        type: 'cancelled',
        agentState: this.state
      };
    }

    // Execute the confirmed action
    return await this.executeAction();
  }

  /**
   * Select appropriate retrieval tool based on extracted intent
   */
  selectRetrievalTool(extractedInfo) {
    const { intent, customerName, customerId, invoiceId } = extractedInfo;

    // Handle "null" strings from LLM extraction
    const cleanCustomerName = (customerName === 'null' || customerName === null) ? null : customerName;
    const cleanCustomerId = (customerId === 'null' || customerId === null) ? null : customerId;

    // Customer identification needed for most operations
    if (cleanCustomerName || cleanCustomerId) {
      return {
        tool: 'findCustomerByName',
        arguments: { name: cleanCustomerName || cleanCustomerId }
      };
    }

    // For operations that need customer ID but already have it, no retrieval needed
    return null;
  }

  /**
   * Execute retrieval tool and return results
   */
  async executeRetrievalTool(toolSelection) {
    const { tool, arguments: args } = toolSelection;
    
    console.log(`🔍 Executing retrieval tool: ${tool}`, args);
    
    this.context.selectedTool = tool;
    this.context.toolArguments = args;

    switch (tool) {
      case 'findCustomerByName':
        return await retrievalTools.findCustomerByName(args.name);

      case 'findInvoiceById':
        return await retrievalTools.findInvoiceById(args.invoiceId);

      case 'getAvailableCredits':
        return await retrievalTools.getAvailableCredits(args.customerId);

      case 'getCustomerPaymentHistory':
        return await retrievalTools.getCustomerPaymentHistory(args.customerId, args.months);

      case 'findOverdueInvoices':
        return await retrievalTools.findOverdueInvoices(args.customerId, args.daysOverdue);

      case 'getPendingInvoices':
        return await retrievalTools.getPendingInvoices(args.customerId);

      default:
        throw new Error(`Unknown retrieval tool: ${tool}`);
    }
  }

  /**
   * Detect if retrieval results are ambiguous
   */
  detectAmbiguity(results) {
    return Array.isArray(results) && results.length > 1;
  }

  /**
   * Generate clarification question for ambiguous results
   */
  async generateClarificationQuestion(results, extractedInfo) {
    this.state = AGENT_STATES.WAITING_FOR_CLARIFICATION;
    this.context.retrievalResults = results;
    this.context.originalExtractedInfo = extractedInfo;

    const clarificationMessage = generateClarificationQuestion(
      this.context.selectedTool,
      results,
      extractedInfo
    );

    return {
      message: clarificationMessage,
      type: 'clarification_needed',
      agentState: this.state,
      options: results
    };
  }

  /**
   * Validate credit application and prepare confirmation or show errors
   */
  async validateAndPrepareConfirmation(extractedInfo) {
    const customer = Array.isArray(this.context.confirmedData) ? this.context.confirmedData[0] : this.context.confirmedData;
    const { creditAmount, invoiceId } = extractedInfo;

    try {
      // Get available credits for validation
      const availableCredits = await retrievalTools.getAvailableCredits(customer.id);

      // Check if customer has enough credits
      if (availableCredits.totalAmount < creditAmount) {
        let message = `💳 **Insufficient Credits Available**\n\n`;
        message += `👤 **Customer:** ${customer.name} (${customer.id})\n`;
        message += `💰 **Requested:** $${creditAmount}\n`;
        message += `💳 **Available:** $${availableCredits.totalAmount}\n`;
        message += `❌ **Shortage:** $${creditAmount - availableCredits.totalAmount}\n\n`;

        if (availableCredits.totalAmount > 0) {
          message += `**Available Credits:**\n`;
          availableCredits.credits.forEach((credit, index) => {
            message += `${index + 1}. $${credit.amount} - ${credit.source}\n`;
          });
          message += `\nWould you like to apply all available credits ($${availableCredits.totalAmount}) instead?`;
        } else {
          message += `This customer has no available credits.`;
        }

        this.reset();
        message = formatBoldText(message);
        message += formatCollapsibleDetails({ availableCredits, requestedAmount: creditAmount }, "💳 Available Credits Details");

        return {
          message,
          type: 'insufficient_credits',
          agentState: 'completed'
        };
      }

      // If specific invoice is mentioned, validate it
      if (invoiceId) {
        const invoiceValidation = await retrievalTools.findAndValidateInvoice(invoiceId, customer.id);

        if (!invoiceValidation.success) {
          let message = `🔴 **Invoice Issue**\n\n`;
          message += `👤 **Customer:** ${customer.name} (${customer.id})\n`;
          message += `📄 **Invoice:** ${invoiceId}\n`;
          message += `❌ **Error:** ${invoiceValidation.error}\n\n`;

          if (invoiceValidation.type === 'invoice_not_found') {
            message += `Invoice ${invoiceId} was not found in the system.`;
          } else if (invoiceValidation.type === 'invoice_not_owned') {
            message += `Invoice ${invoiceId} does not belong to ${customer.name}.`;
          } else if (invoiceValidation.type === 'invoice_already_paid') {
            message += `Invoice ${invoiceId} is already paid.`;
          }

          message = formatBoldText(message);
          message += formatCollapsibleDetails(invoiceValidation, "📄 Invoice Validation Details");

          this.reset();
          return {
            message,
            type: 'error',
            agentState: 'completed'
          };
        }
      }

      // Validation passed, proceed to confirmation
      return await this.prepareActionConfirmation(extractedInfo);

    } catch (error) {
      console.error('❌ Error in validation:', error);
      this.reset();
      return {
        message: `🔴 Error validating request: ${error.message}`,
        type: 'error',
        agentState: 'completed'
      };
    }
  }

  /**
   * Prepare action confirmation prompt
   */
  async prepareActionConfirmation(extractedInfo) {
    this.state = AGENT_STATES.WAITING_FOR_CONFIRMATION;

    // Ensure originalExtractedInfo is stored
    if (!this.context.originalExtractedInfo) {
      this.context.originalExtractedInfo = extractedInfo;
    }

    const confirmationMessage = generateConfirmationPrompt(
      extractedInfo,
      this.context.confirmedData
    );

    return {
      message: confirmationMessage,
      type: 'confirmation_needed',
      agentState: this.state
    };
  }

  /**
   * Parse user's choice from clarification options
   */
  parseUserChoice(userMessage, options) {
    const message = userMessage.toLowerCase();
    
    // Try to match by name or ID
    return options.find(option => {
      const name = option.name?.toLowerCase() || '';
      const id = option.id?.toLowerCase() || '';
      return message.includes(name) || message.includes(id);
    });
  }

  /**
   * Parse user confirmation (yes/no)
   */
  parseConfirmation(userMessage) {
    const message = userMessage.toLowerCase();
    const yesWords = ['yes', 'y', 'confirm', 'ok', 'proceed', 'correct'];
    const noWords = ['no', 'n', 'cancel', 'stop', 'wrong'];
    
    if (yesWords.some(word => message.includes(word))) return true;
    if (noWords.some(word => message.includes(word))) return false;
    
    return null; // Ambiguous response
  }

  /**
   * Execute the confirmed action
   */
  async executeAction() {
    this.state = AGENT_STATES.EXECUTING;

    try {
      const { intent } = this.context.originalExtractedInfo;
      const confirmedData = this.context.confirmedData;

      console.log(`🚀 Executing action: ${intent}`);

      let result;

      switch (intent) {
        case 'credit_balance_inquiry':
          result = await this.executeCreditBalanceInquiry(confirmedData);
          break;

        case 'add_credits':
          result = await this.executeAddCredits(confirmedData);
          break;

        case 'credit_application':
          // If we have an application plan, execute it; otherwise, create the plan
          if (this.context.applicationPlan) {
            result = await this.executeApplicationPlan(confirmedData);
          } else {
            result = await this.executeSmartCreditApplication(confirmedData);
          }
          break;

        case 'payment_history_inquiry':
          result = await this.executePaymentHistoryInquiry(confirmedData);
          break;

        case 'overdue_inquiry':
          result = await this.executeOverdueInquiry(confirmedData);
          break;

        case 'general':
          // Handle failed intent extraction - try to detect what user actually wants
          result = await this.handleGeneralIntent();
          break;

        default:
          result = {
            message: `Action type '${intent}' is not yet implemented.`,
            type: 'info'
          };
      }

      this.state = AGENT_STATES.COMPLETED;
      return {
        ...result,
        agentState: this.state
      };

    } catch (error) {
      console.error('❌ Action execution error:', error);
      this.state = AGENT_STATES.COMPLETED;
      return {
        message: `🔴 Error executing action: ${error.message}`,
        type: 'error',
        agentState: this.state
      };
    }
  }

  /**
   * Handle general intent - try to detect what user actually wants
   */
  async handleGeneralIntent() {
    const originalMessage = this.context.originalRequest;
    const message = originalMessage.toLowerCase();

    console.log('🔍 Handling general intent for:', originalMessage);

    // Try to detect credit application patterns
    if (message.includes('apply') && message.includes('credit')) {
      console.log('🔍 Detected credit application pattern');

      // Extract basic info manually
      const custMatch = originalMessage.match(/CUST\d+/i);
      const invMatch = originalMessage.match(/INV\d+/i);
      const amountMatch = originalMessage.match(/\$?(\d+)/);

      if (custMatch && invMatch && amountMatch) {
        const customerId = custMatch[0].toUpperCase();
        const invoiceId = invMatch[0].toUpperCase();
        const creditAmount = parseInt(amountMatch[1]);

        console.log(`🔍 Manual extraction: ${customerId}, ${invoiceId}, $${creditAmount}`);

        // Try to execute credit application directly
        try {
          // First, look up the customer if we don't have it
          let customer = Array.isArray(this.context.confirmedData) ? this.context.confirmedData[0] : this.context.confirmedData;

          if (!customer) {
            console.log('🔍 No customer in context, looking up customer:', customerId);
            const retrievalTools = require('./tools/retrievalTools');
            const customers = await retrievalTools.findCustomerByName(customerId);

            if (customers.length === 0) {
              return {
                message: `🔴 Customer not found. Please check the customer name or ID.`,
                type: 'error'
              };
            }

            this.context.confirmedData = customers;
            customer = customers[0];
          }

          // Update the original extracted info
          this.context.originalExtractedInfo = {
            ...this.context.originalExtractedInfo,
            intent: 'credit_application',
            customerId,
            invoiceId,
            creditAmount
          };

          return await this.executeSmartCreditApplication(this.context.confirmedData);
        } catch (error) {
          console.error('❌ Error in manual credit application:', error);
        }
      }
    }

    // Default fallback
    return {
      message: `🔴 I couldn't understand your request. Please try rephrasing it or contact support for assistance.\n\n**Original message:** "${originalMessage}"`,
      type: 'error'
    };
  }

  /**
   * Execute add credits to customer
   */
  async executeAddCredits(customerData) {
    // Handle both single customer and array from retrieval
    const customer = Array.isArray(customerData) ? customerData[0] : customerData;

    if (!customer) {
      return {
        message: `🔴 Customer not found. Please check the customer name or ID.`,
        type: 'error'
      };
    }

    const { creditAmount } = this.context.originalExtractedInfo;

    if (!creditAmount || creditAmount <= 0) {
      return {
        message: `🔴 Cannot add credits: Invalid amount. Please specify a positive credit amount.`,
        type: 'error'
      };
    }

    const result = await actionTools.addCreditsToCustomer(
      customer.id,
      creditAmount,
      'manual',
      'Manual credit addition via AI assistant'
    );

    if (result.success) {
      let message = `✅ **Credits Added Successfully!**\n\n`;
      message += `💰 Added $${result.credit.amount} to ${customer.name}'s account\n`;
      message += `🆔 Credit ID: ${result.credit.id}\n`;
      message += `📅 Date: ${new Date().toLocaleDateString()}\n`;
      message += `📝 Source: Manual addition`;

      // Format with collapsible details
      message = formatBoldText(message);
      message += formatCollapsibleDetails({
        success: true,
        credit: {
          id: result.credit.id,
          amount: result.credit.amount,
          date: result.credit.date
        },
        customer: {
          id: customer.id,
          name: customer.name
        },
        type: 'credits_added'
      }, "💳 Credit Details");

      return {
        message,
        type: 'success'
      };
    } else {
      let message = `🔴 **Failed to Add Credits**\n\n${result.error}`;

      // Format with collapsible details
      message = formatBoldText(message);
      message += formatCollapsibleDetails(result, "❌ Error Details");

      return {
        message,
        type: 'error'
      };
    }
  }

  /**
   * Execute credit balance inquiry
   */
  async executeCreditBalanceInquiry(customerData) {
    // Handle both single customer and array from retrieval
    const customer = Array.isArray(customerData) ? customerData[0] : customerData;

    console.log('🔍 executeCreditBalanceInquiry called with:', customerData);
    console.log('🔍 Processed customer:', customer);

    if (!customer) {
      console.log('❌ No customer found in executeCreditBalanceInquiry');
      return {
        message: `🔴 Customer not found. Please check the customer name or ID.`,
        type: 'error'
      };
    }

    const credits = await retrievalTools.getAvailableCredits(customer.id);

    let message = `💳 **Credit Balance for ${customer.name}**\n\n`;
    message += `👤 **Customer:** ${customer.name} (${customer.id})\n`;
    message += `💰 **Total Available Credits:** $${credits.totalAmount}\n`;
    message += `📊 **Number of Credits:** ${credits.creditCount}\n\n`;

    if (credits.credits.length > 0) {
      message += `**Credit Details:**\n`;
      credits.credits.forEach((credit, index) => {
        const earnedDate = new Date(credit.earnedDate).toLocaleDateString();
        const expiryDate = new Date(credit.expiryDate).toLocaleDateString();
        message += `${index + 1}. $${credit.amount} - ${credit.source}\n`;
        message += `   📅 Earned: ${earnedDate} | Expires: ${expiryDate}\n`;
        message += `   📝 ${credit.description}\n\n`;
      });
    } else {
      message += `No active credits found for this customer.`;
    }

    // Add collapsible details section and format bold text
    message = formatBoldText(message);
    message += formatCollapsibleDetails(credits);

    return {
      message,
      type: 'success'
    };
  }

  /**
   * Execute smart credit application (finds best invoices to apply to)
   */
  async executeSmartCreditApplication(customerData) {
    const customer = Array.isArray(customerData) ? customerData[0] : customerData;

    if (!customer) {
      return {
        message: `🔴 Customer not found. Please check the customer name or ID.`,
        type: 'error'
      };
    }

    const { creditAmount, invoiceId } = this.context.originalExtractedInfo;

    try {
      // Get available credits for the customer
      const availableCredits = await retrievalTools.getAvailableCredits(customer.id);

      // Check if customer has enough credits
      if (availableCredits.totalAmount < creditAmount) {
        let message = `💳 **Insufficient Credits Available**\n\n`;
        message += `👤 **Customer:** ${customer.name} (${customer.id})\n`;
        message += `💰 **Requested:** $${creditAmount}\n`;
        message += `💳 **Available:** $${availableCredits.totalAmount}\n`;
        message += `❌ **Shortage:** $${creditAmount - availableCredits.totalAmount}\n\n`;

        if (availableCredits.totalAmount > 0) {
          message += `**Available Credits:**\n`;
          availableCredits.credits.forEach((credit, index) => {
            message += `${index + 1}. $${credit.amount} - ${credit.source}\n`;
          });
          message += `\nWould you like to apply all available credits ($${availableCredits.totalAmount}) instead?`;
        } else {
          message += `This customer has no available credits.`;
        }

        return {
          message,
          type: 'insufficient_credits',
          details: { availableCredits, requestedAmount: creditAmount }
        };
      }

      // If specific invoice is mentioned, validate it
      if (invoiceId) {
        const invoiceValidation = await retrievalTools.findAndValidateInvoice(invoiceId, customer.id);

        if (!invoiceValidation.success) {
          let message = `🔴 **Invoice Issue**\n\n`;
          message += `👤 **Customer:** ${customer.name} (${customer.id})\n`;
          message += `📄 **Invoice:** ${invoiceId}\n`;
          message += `❌ **Error:** ${invoiceValidation.error}\n\n`;

          if (invoiceValidation.type === 'invoice_not_found') {
            message += `Invoice ${invoiceId} was not found in the system.`;
          } else if (invoiceValidation.type === 'invoice_not_owned') {
            message += `Invoice ${invoiceId} does not belong to ${customer.name}.`;
          } else if (invoiceValidation.type === 'invoice_already_paid') {
            message += `Invoice ${invoiceId} is already paid.`;
          }

          return {
            message,
            type: 'error',
            details: invoiceValidation
          };
        }

        // Apply to specific invoice
        const invoice = invoiceValidation.invoice;
        const amountToApply = Math.min(creditAmount, invoice.currentAmount);
        const newBalance = invoice.currentAmount - amountToApply;

        const applicationPlan = [{
          invoiceId: invoice.id,
          amount: amountToApply,
          currentBalance: invoice.currentAmount,
          newBalance,
          currentStatus: invoice.status,
          newStatus: newBalance === 0 ? 'paid' : 'partial'
        }];

        let message = `💳 **Credit Application Plan**\n\n`;
        message += `👤 **Customer:** ${customer.name} (${customer.id})\n`;
        message += `💰 **Credits to Apply:** $${creditAmount}\n`;
        message += `💳 **Available Credits:** $${availableCredits.totalAmount}\n\n`;

        message += `**Application Plan:**\n`;
        message += `1. Invoice ${invoice.id}: $${amountToApply}\n`;
        message += `   Current Balance: $${invoice.currentAmount} → New Balance: $${newBalance}\n`;
        message += `   Status: ${invoice.status} → ${newBalance === 0 ? 'paid' : 'partial'}\n\n`;

        if (amountToApply < creditAmount) {
          message += `**Note:** Only $${amountToApply} will be applied (invoice balance limit)\n`;
        }

        // Store the application plan for execution
        this.context.applicationPlan = applicationPlan;

        return {
          message,
          type: 'success',
          details: { applicationPlan, availableCredits, targetInvoice: invoice }
        };
      }

      // No specific invoice - find pending invoices
      const pendingInvoices = await retrievalTools.getPendingInvoices(customer.id);

      // Check if customer has pending invoices
      if (pendingInvoices.length === 0) {
        let message = `📋 **No Pending Invoices**\n\n` +
                     `👤 **Customer:** ${customer.name} (${customer.id})\n` +
                     `💳 **Available Credits:** $${availableCredits.totalAmount}\n\n` +
                     `This customer has no pending invoices to apply credits to. All invoices are already paid.`;

        // Format with collapsible details like credit balance query
        message = formatBoldText(message);
        message += formatCollapsibleDetails({ availableCredits, pendingInvoices }, "📋 Technical Details");

        return {
          message,
          type: 'no_pending_invoices',
          agentState: 'completed'
        };
      }

      // Calculate optimal credit application
      const applicationPlan = this.calculateCreditApplication(pendingInvoices, creditAmount);

      let message = `💳 **Credit Application Plan**\n\n`;
      message += `👤 **Customer:** ${customer.name} (${customer.id})\n`;
      message += `💰 **Credits to Apply:** $${creditAmount}\n`;
      message += `💳 **Available Credits:** $${availableCredits.totalAmount}\n\n`;

      message += `**Application Plan:**\n`;
      let totalApplied = 0;
      applicationPlan.forEach((application, index) => {
        message += `${index + 1}. Invoice ${application.invoiceId}: $${application.amount}\n`;
        message += `   Current Balance: $${application.currentBalance} → New Balance: $${application.newBalance}\n`;
        message += `   Status: ${application.currentStatus} → ${application.newStatus}\n\n`;
        totalApplied += application.amount;
      });

      message += `**Summary:**\n`;
      message += `💰 Total Applied: $${totalApplied}\n`;
      message += `📋 Invoices Affected: ${applicationPlan.length}\n`;

      // Store the application plan for execution
      this.context.applicationPlan = applicationPlan;

      return {
        message,
        type: 'success',
        details: { applicationPlan, availableCredits, pendingInvoices }
      };

    } catch (error) {
      console.error('❌ Error in smart credit application:', error);
      return {
        message: `🔴 Error processing credit application: ${error.message}`,
        type: 'error'
      };
    }
  }

  /**
   * Calculate optimal credit application across invoices
   */
  calculateCreditApplication(pendingInvoices, creditAmount) {
    const applicationPlan = [];
    let remainingCredits = creditAmount;

    // Sort invoices by remaining balance (smallest first for complete payoffs)
    const sortedInvoices = pendingInvoices.sort((a, b) => {
      const balanceA = a.remainingBalance || a.amount;
      const balanceB = b.remainingBalance || b.amount;
      return balanceA - balanceB;
    });

    for (const invoice of sortedInvoices) {
      if (remainingCredits <= 0) break;

      const currentBalance = invoice.remainingBalance || invoice.amount;
      const creditToApply = Math.min(remainingCredits, currentBalance);
      const newBalance = currentBalance - creditToApply;

      applicationPlan.push({
        invoiceId: invoice.id,
        amount: creditToApply,
        currentBalance,
        newBalance,
        currentStatus: invoice.status,
        newStatus: newBalance === 0 ? 'paid' : 'partial'
      });

      remainingCredits -= creditToApply;
    }

    return applicationPlan;
  }

  /**
   * Execute the confirmed application plan
   */
  async executeApplicationPlan(customerData) {
    const customer = Array.isArray(customerData) ? customerData[0] : customerData;
    const applicationPlan = this.context.applicationPlan;

    if (!applicationPlan || applicationPlan.length === 0) {
      return {
        message: `🔴 No application plan found. Please try again.`,
        type: 'error'
      };
    }

    try {
      const results = [];
      let totalApplied = 0;

      // Execute each application in the plan
      for (const application of applicationPlan) {
        const result = await actionTools.applyCreditsToInvoice(
          application.invoiceId,
          application.amount,
          customer.id
        );

        if (result.success) {
          results.push(result);
          totalApplied += application.amount;
        } else {
          let message = `🔴 **Credit Application Failed**\n\n` +
                       `Failed to apply $${application.amount} to invoice ${application.invoiceId}:\n` +
                       `${result.error}`;

          // Format with collapsible details
          message = formatBoldText(message);
          message += formatCollapsibleDetails(result, "❌ Error Details");

          return {
            message,
            type: 'error'
          };
        }
      }

      // Generate success message
      let message = `✅ **Credits Applied Successfully!**\n\n`;
      message += `👤 **Customer:** ${customer.name} (${customer.id})\n`;
      message += `💰 **Total Applied:** $${totalApplied}\n`;
      message += `📋 **Invoices Updated:** ${results.length}\n\n`;

      message += `**Application Details:**\n`;
      results.forEach((result, index) => {
        const application = applicationPlan[index];
        message += `${index + 1}. Invoice ${result.invoice.id}: $${application.amount}\n`;
        message += `   Balance: $${result.invoice.previousBalance} → $${result.invoice.newBalance}\n`;
        message += `   Status: ${application.currentStatus} → ${result.invoice.status}\n\n`;
      });

      // Format with collapsible details
      message = formatBoldText(message);
      message += formatCollapsibleDetails({
        results,
        totalApplied,
        invoicesUpdated: results.length,
        applicationPlan
      }, "💳 Application Details");

      // Clear the application plan
      this.context.applicationPlan = null;

      return {
        message,
        type: 'success'
      };

    } catch (error) {
      console.error('❌ Error executing application plan:', error);
      return {
        message: `🔴 Error executing credit application: ${error.message}`,
        type: 'error'
      };
    }
  }

  /**
   * Execute payment history inquiry
   */
  async executePaymentHistoryInquiry(customer) {
    const history = await retrievalTools.getCustomerPaymentHistory(customer.id, 12);

    let message = `📊 **Payment History for ${customer.name}**\n\n`;
    message += `👤 **Customer:** ${customer.name} (${customer.id})\n`;
    message += `📅 **Period:** ${history.period}\n`;
    message += `📋 **Total Invoices:** ${history.totalInvoices}\n`;
    message += `💰 **Total Invoiced:** $${history.totalInvoiced}\n`;
    message += `💳 **Total Paid:** $${history.totalPaid}\n`;
    message += `⏳ **Total Pending:** $${history.totalPending}\n`;
    message += `📈 **Payment Rate:** ${history.paymentRate}%\n`;
    message += `📊 **Average Invoice:** $${history.averageInvoiceAmount}\n`;
    message += `📈 **Trend:** ${history.paymentTrend}`;

    // Format with collapsible details
    message = formatBoldText(message);
    message += formatCollapsibleDetails(history, "📊 Payment History Details");

    return {
      message,
      type: 'success'
    };
  }

  /**
   * Execute overdue inquiry
   */
  async executeOverdueInquiry(customer) {
    const customerId = customer ? customer.id : null;
    const overdueInvoices = await retrievalTools.findOverdueInvoices(customerId, 30);

    let message = `⏰ **Overdue Invoices Report**\n\n`;

    if (overdueInvoices.length === 0) {
      message += customer
        ? `✅ No overdue invoices found for ${customer.name}`
        : `✅ No overdue invoices found`;
    } else {
      message += `Found ${overdueInvoices.length} overdue invoice(s):\n\n`;

      overdueInvoices.forEach((invoice, index) => {
        const urgencyEmoji = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🟢'
        }[invoice.urgency];

        message += `${index + 1}. ${urgencyEmoji} **${invoice.id}** - $${invoice.remainingBalance}\n`;
        message += `   Customer: ${invoice.customerName}\n`;
        message += `   Days Overdue: ${invoice.daysOverdue}\n`;
        message += `   Urgency: ${invoice.urgency}\n\n`;
      });
    }

    // Format with collapsible details
    message = formatBoldText(message);
    message += formatCollapsibleDetails(overdueInvoices, "⏰ Overdue Invoice Details");

    return {
      message,
      type: overdueInvoices.length > 0 ? 'warning' : 'success'
    };
  }

  /**
   * Reset agent state
   */
  reset() {
    this.state = AGENT_STATES.ANALYZING;
    this.context = {
      originalRequest: null,
      selectedTool: null,
      toolArguments: null,
      retrievalResults: null,
      confirmedData: null,
      pendingAction: null
    };
  }

  /**
   * Reset and start fresh analysis
   */
  async resetAndAnalyze(userMessage, model, conversationContext) {
    this.reset();
    return await this.analyzeAndRetrieve(userMessage, model, conversationContext);
  }
}

module.exports = {
  ClarifyingRAGAgent,
  AGENT_STATES
};
