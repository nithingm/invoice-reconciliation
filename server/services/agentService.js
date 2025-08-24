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
   * Step 1: Analyze intent and execute retrieval tools
   */
  async analyzeAndRetrieve(userMessage, model, conversationContext) {
    this.context.originalRequest = userMessage;

    // Use existing LLM to extract intent and parameters
    const extractedInfo = await extractInfoWithLLM(userMessage, model, conversationContext);

    console.log('🧠 Extracted info:', extractedInfo);

    // Store extracted info for later use
    this.context.originalExtractedInfo = extractedInfo;

    // Determine which retrieval tool to use based on intent
    const toolSelection = this.selectRetrievalTool(extractedInfo);

    if (!toolSelection) {
      // For read-only operations (like credit_balance_inquiry), execute directly without confirmation
      if (this.isReadOnlyOperation(extractedInfo.intent)) {
        return await this.executeDirectly(extractedInfo);
      }

      // For write operations, proceed to action confirmation
      return await this.prepareActionConfirmation(extractedInfo);
    }

    // Execute the retrieval tool
    const retrievalResults = await this.executeRetrievalTool(toolSelection);

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

    // Customer identification needed for most operations
    if ((customerName || customerId) && !this.context.confirmedCustomer) {
      return {
        tool: 'findCustomerByName',
        arguments: { name: customerName || customerId }
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

      return {
        message,
        type: 'success',
        details: result
      };
    } else {
      return {
        message: `🔴 **Failed to Add Credits**\n\n${result.error}`,
        type: 'error',
        details: result
      };
    }
  }

  /**
   * Execute credit balance inquiry
   */
  async executeCreditBalanceInquiry(customerData) {
    // Handle both single customer and array from retrieval
    const customer = Array.isArray(customerData) ? customerData[0] : customerData;

    if (!customer) {
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

    return {
      message,
      type: 'success',
      details: credits
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
        return {
          message: `📋 **No Pending Invoices**\n\n` +
                   `👤 **Customer:** ${customer.name} (${customer.id})\n` +
                   `💳 **Available Credits:** $${availableCredits.totalAmount}\n\n` +
                   `This customer has no pending invoices to apply credits to. All invoices are already paid.`,
          type: 'no_pending_invoices',
          details: { availableCredits, pendingInvoices }
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
          return {
            message: `🔴 **Credit Application Failed**\n\n` +
                     `Failed to apply $${application.amount} to invoice ${application.invoiceId}:\n` +
                     `${result.error}`,
            type: 'error',
            details: result
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

      // Clear the application plan
      this.context.applicationPlan = null;

      return {
        message,
        type: 'success',
        details: { results, totalApplied, invoicesUpdated: results.length }
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

    return {
      message,
      type: 'success',
      details: history
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

    return {
      message,
      type: overdueInvoices.length > 0 ? 'warning' : 'success',
      details: overdueInvoices
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
