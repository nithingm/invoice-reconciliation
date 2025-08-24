# 🤖 **Clarifying RAG Agent - Enhanced AI System**

## 🎯 **Overview**

The Clarifying RAG Agent is an advanced AI system that intelligently handles ambiguity, provides step-by-step confirmations, and maintains context-aware conversations. It represents a significant upgrade from traditional single-LLM approaches.

## 🏗️ **Architecture**

### **Core Components**

1. **Agent Orchestrator** (`server/services/agentService.js`)
   - Manages conversation state and workflow
   - Routes between retrieval and action tools
   - Handles ambiguity detection and confirmation

2. **Retrieval Tools** (`server/services/tools/retrievalTools.js`)
   - Safe, read-only database operations
   - No user confirmation required

3. **Action Tools** (`server/services/tools/actionTools.js`)
   - Write operations requiring confirmation
   - Protected by validation and confirmation workflows

4. **Agent Prompts** (`server/config/agentPrompts.js`)
   - Human-friendly clarification questions
   - Confirmation prompts for actions

## 🔄 **Workflow**

```
User Message → Intent Analysis → Retrieval Tools → Ambiguity Detection → Clarification → Confirmation → Action Tools → Response
```

### **Example Workflow**

1. **User:** "Add 100 credits for John"
2. **Agent:** Detects ambiguity → "I found 2 customers matching 'John'. Which one did you mean?"
3. **User:** "John Smith"
4. **Agent:** Moves to confirmation → "I'm ready to apply $100 in credits... Is this correct?"
5. **User:** "Yes, proceed"
6. **Agent:** Executes action → "Credits applied successfully!"

## 🛠️ **Available Tools**

### **Retrieval Tools (Read-Only)**

| Tool | Purpose | Parameters |
|------|---------|------------|
| `findCustomerByName` | Find customers by name with fuzzy matching | `name` |
| `findInvoiceById` | Find specific invoice | `invoiceId` |
| `getPendingInvoices` | Get pending invoices for customer | `customerId` |
| `getAvailableCredits` | Get customer credit balance | `customerId` |
| `getCustomerPaymentHistory` | Get payment analytics | `customerId, months` |
| `findOverdueInvoices` | Find overdue invoices with urgency levels | `customerId, daysOverdue` |
| `universalSearch` | Search across all entities | `searchText` |

### **Action Tools (Require Confirmation)**

| Tool | Purpose | Parameters |
|------|---------|------------|
| `applyCreditsToInvoice` | Apply credits to single invoice | `invoiceId, creditAmount, customerId` |
| `bulkApplyCredits` | Apply credits to multiple invoices | `customerId, applications[]` |
| `createCreditMemo` | Create credit memo for discrepancies | `creditMemoData` |
| `createPaymentPlan` | Set up payment plan for overdue invoices | `customerId, invoiceIds, planDetails` |
| `addCreditsToCustomer` | Add credits to customer account | `customerId, amount, source` |
| `processPartialPayment` | Process partial payment | `invoiceId, paymentAmount, customerId` |
| `generateCustomerStatement` | Generate detailed account statement | `customerId, periodStart, periodEnd` |

## 🎨 **Frontend Integration**

### **Enhanced Chat Experience**

- **Smart Message Styling**: Different colors for clarification, confirmation, success, and error messages
- **Context Awareness**: Maintains conversation state across messages
- **Real-time Updates**: Instant responses with visual feedback

### **Message Types**

| Type | Styling | Icon | Purpose |
|------|---------|------|---------|
| `clarification_needed` | Blue border | ℹ️ | When multiple options found |
| `confirmation_needed` | Yellow border | ⚠️ | Before executing actions |
| `success` | Green border | ✅ | Successful operations |
| `error` | Red border | ❌ | Error messages |

## 🚀 **Business Scenarios**

### **1. Ambiguous Customer Identification**
```
User: "Check credits for John"
Agent: "I found 3 customers named John. Which one?"
User: "John Smith from Auto Repair"
Agent: "John Smith (CUST001) has $250 in available credits"
```

### **2. Bulk Operations**
```
User: "Apply credits to all pending invoices for CUST001"
Agent: "I found 3 pending invoices totaling $1,200. Apply $1,200 in credits?"
User: "Yes"
Agent: "Applied credits to 3 invoices successfully"
```

### **3. Payment Plan Creation**
```
User: "Set up payment plan for overdue invoices"
Agent: "Found 2 overdue invoices for $2,500. Monthly payment amount?"
User: "$500 per month"
Agent: "Create 5-month payment plan starting next month?"
User: "Yes"
Agent: "Payment plan PLAN-123 created successfully"
```

### **4. Advanced Analytics**
```
User: "Show payment history for CUST001"
Agent: "Customer has 85% payment rate over 12 months. Trend: Improving. 
        Total invoiced: $15,000, Paid: $12,750, Pending: $2,250"
```

## 📊 **Advanced Features**

### **Payment Analytics**
- Payment rate calculations
- Trend analysis (improving/declining/stable)
- Average invoice amounts
- Overdue invoice urgency levels

### **Bulk Operations**
- Multi-invoice credit applications
- Batch payment processing
- Bulk status updates

### **Statement Generation**
- Detailed period statements
- Summary analytics
- Invoice and credit breakdowns

## 🔧 **Configuration**

### **Agent States**
- `ANALYZING` - Processing user intent
- `WAITING_FOR_CLARIFICATION` - Awaiting user choice
- `WAITING_FOR_CONFIRMATION` - Awaiting action approval
- `EXECUTING` - Performing action
- `COMPLETED` - Action finished

### **Socket Events**
- `chat_message_agent` - Enhanced agent processing
- `chat_message` - Traditional processing (fallback)

## 🧪 **Testing**

```bash
# Test the agent
npm run test:agent

# Test Gemini connection
npm run test:gemini

# Start full application
npm run dev
```

## 🎯 **Benefits**

✅ **Intelligent Ambiguity Handling** - No more guessing which "John" the user means
✅ **Action Confirmation** - Prevents accidental data changes
✅ **Context Awareness** - Remembers conversation state
✅ **Sophisticated Business Logic** - Handles complex scenarios
✅ **Enhanced User Experience** - Clear, step-by-step interactions
✅ **Fallback Support** - Falls back to traditional system if needed

## 🔮 **Future Enhancements**

- **Multi-step Workflows** - Complex business processes
- **Approval Chains** - Manager approval for large transactions
- **Automated Scheduling** - Payment reminders and follow-ups
- **Integration APIs** - Connect with external accounting systems
- **Machine Learning** - Learn from user patterns and preferences

---

*The Clarifying RAG Agent represents the future of business AI - intelligent, context-aware, and user-friendly.*
