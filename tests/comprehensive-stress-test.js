require('dotenv').config({ path: '../.env' });
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive stress test for the invoice reconciliation system
 * Tests the backend agent service directly with all the provided test cases
 */
class ComprehensiveStressTest {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.agents = new Map(); // Store agents by session ID
  }

  async setup() {
    console.log('🚀 Setting up comprehensive stress test...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected');
  }

  async testMessage(message, expectedIntent, category, sessionId = 'stress-test') {
    console.log(`📤 Testing: "${message}"`);
    const startTime = Date.now();
    
    try {
      // Get or create agent for this session
      let agent = this.agents.get(sessionId);
      if (!agent) {
        agent = new ClarifyingRAGAgent(sessionId);
        this.agents.set(sessionId, agent);
      }

      // Process the message
      const result = await agent.processRequest(message, 'gemini-2.5-flash-lite');
      const responseTime = Date.now() - startTime;
      
      // Analyze the response
      const analysis = this.analyzeResponse(result, expectedIntent);
      
      console.log(`📥 Response (${responseTime}ms): ${analysis.status} - ${result.type}`);
      if (analysis.hasCollapsibleDetails) {
        console.log(`   📋 Has collapsible details`);
      }
      
      return {
        message,
        expectedIntent,
        category,
        sessionId,
        success: analysis.success,
        responseTime,
        actualType: result.type,
        agentState: result.agentState,
        hasCollapsibleDetails: analysis.hasCollapsibleDetails,
        hasProperFormatting: analysis.hasProperFormatting,
        response: result.message ? result.message.substring(0, 200) + '...' : 'No response',
        fullResult: result,
        analysis,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`❌ Error (${responseTime}ms): ${error.message}`);
      
      return {
        message,
        expectedIntent,
        category,
        sessionId,
        success: false,
        responseTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  analyzeResponse(result, expectedIntent) {
    const analysis = {
      success: false,
      status: '❌',
      hasCollapsibleDetails: false,
      hasProperFormatting: false,
      intentMatch: false,
      responseQuality: 'poor'
    };

    // Check if we got a response
    if (!result || !result.message) {
      analysis.status = '❌ No response';
      return analysis;
    }

    // Check for collapsible details
    analysis.hasCollapsibleDetails = result.message.includes('---DETAILS---');
    
    // Check for proper formatting (bold text)
    analysis.hasProperFormatting = result.message.includes('**');
    
    // Check response type appropriateness
    const appropriateTypes = {
      'credit_balance_inquiry': ['success', 'error', 'clarification_needed'],
      'credit_application': ['success', 'confirmation_needed', 'insufficient_credits', 'no_pending_invoices', 'error'],
      'invoice_inquiry': ['success', 'error'],
      'purchase_history': ['success', 'error'],
      'quantity_discrepancy': ['success', 'error'],
      'damage_report': ['success', 'error'],
      'partial_payment': ['success', 'error'],
      'general': ['success', 'info']
    };

    const expectedTypes = appropriateTypes[expectedIntent] || ['success', 'error'];
    analysis.intentMatch = expectedTypes.includes(result.type);
    
    // Determine overall success
    if (result.message && (analysis.intentMatch || result.type === 'clarification_needed')) {
      analysis.success = true;
      analysis.status = '✅';
      
      if (analysis.hasCollapsibleDetails && analysis.hasProperFormatting) {
        analysis.responseQuality = 'excellent';
      } else if (analysis.hasCollapsibleDetails || analysis.hasProperFormatting) {
        analysis.responseQuality = 'good';
      } else {
        analysis.responseQuality = 'fair';
      }
    }
    
    return analysis;
  }

  async runAllTests() {
    console.log('🧪 Running comprehensive stress tests...');
    
    const testCases = [
      // 1. Credit Balance Inquiry
      { message: "What is the credit balance for CUST001?", intent: "credit_balance_inquiry", category: "Credit Balance - Simple ID" },
      { message: "Show me the credits for John Smith.", intent: "credit_balance_inquiry", category: "Credit Balance - Simple Name" },
      { message: "What's the balance for John?", intent: "credit_balance_inquiry", category: "Credit Balance - Ambiguous" },
      { message: "What's my balance?", intent: "credit_balance_inquiry", category: "Credit Balance - No Customer" },
      { message: "Check credits for CUST999.", intent: "credit_balance_inquiry", category: "Credit Balance - Invalid Customer" },
      
      // 2. Credit Application
      { message: "Apply $100 of credit for CUST001 to invoice INV001.", intent: "credit_application", category: "Credit Application - Simple" },
      { message: "Use $200 of credit for Lisa Chen.", intent: "credit_application", category: "Credit Application - Smart (No Invoice)" },
      { message: "Use $50 credit for John.", intent: "credit_application", category: "Credit Application - Ambiguous Customer" },
      { message: "Apply $5000 credit for CUST001.", intent: "credit_application", category: "Credit Application - Insufficient Credits" },
      { message: "Apply $500 credit to invoice INV005.", intent: "credit_application", category: "Credit Application - Exceeds Balance" },
      
      // 3. Invoice Inquiry
      { message: "Show me the details for invoice INV002.", intent: "invoice_inquiry", category: "Invoice Inquiry - Simple" },
      { message: "What's the status of INV003?", intent: "invoice_inquiry", category: "Invoice Inquiry - Different Phrasing" },
      { message: "Pull up invoice INV999.", intent: "invoice_inquiry", category: "Invoice Inquiry - Invalid Invoice" },
      
      // 4. Purchase History
      { message: "Show me the purchase history for Sarah Johnson.", intent: "purchase_history", category: "Purchase History - Simple" },
      { message: "What has CUST005 bought?", intent: "purchase_history", category: "Purchase History - By ID" },
      { message: "Show me the history for John.", intent: "purchase_history", category: "Purchase History - Ambiguous" },
      
      // 5. Quantity Discrepancy
      { message: "We were short 5 units of the 'Standard Rebuild Kit' on invoice INV001.", intent: "quantity_discrepancy", category: "Quantity Discrepancy - Simple" },
      { message: "We were missing 10 items on invoice INV003.", intent: "quantity_discrepancy", category: "Quantity Discrepancy - Vague Item" },
      { message: "We had a quantity discrepancy for CUST001.", intent: "quantity_discrepancy", category: "Quantity Discrepancy - Vague Invoice" },
      
      // 6. Damage Report
      { message: "The 'Torque Converter' on invoice INV002 arrived damaged.", intent: "damage_report", category: "Damage Report - Simple" },
      { message: "Something was broken in our last shipment for CUST004.", intent: "damage_report", category: "Damage Report - Vague" },
      
      // 7. Partial Payment
      { message: "We made a partial payment of $4000 on invoice INV003 for Mike Wilson.", intent: "partial_payment", category: "Partial Payment - Simple" },
      { message: "I paid $6000 for invoice INV005.", intent: "partial_payment", category: "Partial Payment - Exceeds Balance" },
      
      // 8. General/Fallback
      { message: "Hello", intent: "general", category: "General - Greeting" },
      { message: "What services do you offer?", intent: "general", category: "General - Question" },
      { message: "Colorless green ideas sleep furiously.", intent: "general", category: "General - Nonsense" }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n[${i + 1}/${testCases.length}] ${testCase.category}`);
      
      const result = await this.testMessage(
        testCase.message, 
        testCase.intent, 
        testCase.category,
        `stress-test-${i}`
      );
      
      this.results.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  generateDetailedReport() {
    const totalTime = Date.now() - this.startTime;
    const successCount = this.results.filter(r => r.success).length;
    const failureCount = this.results.filter(r => !r.success).length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length;
    
    // Categorize results
    const categories = {};
    this.results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = { total: 0, success: 0, results: [] };
      }
      categories[result.category].total++;
      if (result.success) categories[result.category].success++;
      categories[result.category].results.push(result);
    });

    // Quality metrics
    const excellentResponses = this.results.filter(r => r.analysis?.responseQuality === 'excellent').length;
    const goodResponses = this.results.filter(r => r.analysis?.responseQuality === 'good').length;
    const collapsibleDetailsCount = this.results.filter(r => r.hasCollapsibleDetails).length;
    const properFormattingCount = this.results.filter(r => r.hasProperFormatting).length;

    const report = {
      summary: {
        totalTests: this.results.length,
        successCount,
        failureCount,
        successRate: (successCount / this.results.length * 100).toFixed(2) + '%',
        avgResponseTime: Math.round(avgResponseTime) + 'ms',
        totalTestTime: Math.round(totalTime / 1000) + 's',
        qualityMetrics: {
          excellentResponses,
          goodResponses,
          collapsibleDetailsCount,
          properFormattingCount,
          collapsibleDetailsRate: (collapsibleDetailsCount / this.results.length * 100).toFixed(1) + '%',
          properFormattingRate: (properFormattingCount / this.results.length * 100).toFixed(1) + '%'
        }
      },
      categories,
      results: this.results,
      timestamp: new Date().toISOString()
    };
    
    return report;
  }

  printReport(report) {
    console.log('\n📊 COMPREHENSIVE STRESS TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Success: ${report.summary.successCount} (${report.summary.successRate})`);
    console.log(`Failures: ${report.summary.failureCount}`);
    console.log(`Average Response Time: ${report.summary.avgResponseTime}`);
    console.log(`Total Test Time: ${report.summary.totalTestTime}`);
    
    console.log('\n🎯 QUALITY METRICS');
    console.log('='.repeat(60));
    console.log(`Excellent Responses: ${report.summary.qualityMetrics.excellentResponses}`);
    console.log(`Good Responses: ${report.summary.qualityMetrics.goodResponses}`);
    console.log(`Collapsible Details: ${report.summary.qualityMetrics.collapsibleDetailsCount} (${report.summary.qualityMetrics.collapsibleDetailsRate})`);
    console.log(`Proper Formatting: ${report.summary.qualityMetrics.properFormattingCount} (${report.summary.qualityMetrics.properFormattingRate})`);
    
    console.log('\n📋 RESULTS BY CATEGORY');
    console.log('='.repeat(60));
    
    Object.entries(report.categories).forEach(([category, data]) => {
      const successRate = (data.success / data.total * 100).toFixed(1);
      console.log(`\n${category}: ${data.success}/${data.total} (${successRate}%)`);
      
      data.results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const quality = result.analysis?.responseQuality || 'unknown';
        const details = result.hasCollapsibleDetails ? '📋' : '  ';
        console.log(`  ${status} ${details} ${result.message} (${result.responseTime}ms) [${quality}]`);
        if (result.error) {
          console.log(`     Error: ${result.error}`);
        }
        if (result.actualType) {
          console.log(`     Type: ${result.actualType}, State: ${result.agentState || 'N/A'}`);
        }
      });
    });
  }

  async cleanup() {
    await disconnectFromMongoDB();
    console.log('✅ MongoDB disconnected');
  }
}

// Main execution function
async function runComprehensiveStressTest() {
  const tester = new ComprehensiveStressTest();
  
  try {
    await tester.setup();
    await tester.runAllTests();
    
    const report = tester.generateDetailedReport();
    tester.printReport(report);
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'comprehensive-stress-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Comprehensive stress test failed:', error);
    throw error;
  } finally {
    await tester.cleanup();
  }
}

// Export for use in other files
module.exports = { ComprehensiveStressTest, runComprehensiveStressTest };

// Run if called directly
if (require.main === module) {
  runComprehensiveStressTest().catch(console.error);
}
