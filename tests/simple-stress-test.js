const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Simplified stress test that focuses on backend API testing
 */
class SimpleStressTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
    this.startTime = Date.now();
  }

  async setup() {
    console.log('🚀 Setting up simplified stress test...');
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    
    // Navigate to the application
    await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(2000);
    
    // Try to open chat
    try {
      const chatButton = await this.page.$('button[aria-label*="chat" i]');
      if (chatButton) {
        await chatButton.click();
        console.log('✅ Chat opened');
      } else {
        console.log('⚠️ Chat button not found, continuing...');
      }
    } catch (e) {
      console.log('⚠️ Could not open chat, continuing...');
    }
    
    await this.page.waitForTimeout(1000);
  }

  async sendMessage(message, expectedIntent = null) {
    console.log(`📤 Testing: "${message}"`);
    const startTime = Date.now();
    
    try {
      // Find input field
      const input = await this.page.$('input[type="text"], input[placeholder*="message" i]');
      if (!input) {
        throw new Error('Could not find input field');
      }
      
      // Clear and type message
      await input.fill(message);
      await input.press('Enter');
      
      // Wait for response (simplified - just wait for network activity to settle)
      await this.page.waitForTimeout(3000);
      await this.page.waitForLoadState('networkidle');
      
      // Get all text content from the page
      const pageContent = await this.page.textContent('body');
      
      // Look for response indicators
      const hasResponse = pageContent.includes('AI Assistant') || 
                         pageContent.includes('Credits') || 
                         pageContent.includes('Invoice') ||
                         pageContent.includes('Customer') ||
                         pageContent.includes('Error') ||
                         pageContent.includes('Success');
      
      const responseTime = Date.now() - startTime;
      
      return {
        message,
        success: hasResponse,
        responseTime,
        expectedIntent,
        hasCollapsibleDetails: pageContent.includes('Technical Details') || pageContent.includes('Details'),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        message,
        success: false,
        responseTime,
        expectedIntent,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async runTests() {
    console.log('🧪 Running simplified stress tests...');
    
    const testCases = [
      // High-priority test cases
      { message: "What is the credit balance for CUST001?", intent: "credit_balance_inquiry" },
      { message: "Show me the credits for John Smith.", intent: "credit_balance_inquiry" },
      { message: "Apply $100 of credit for CUST001 to invoice INV001.", intent: "credit_application" },
      { message: "Use $50 credit for John.", intent: "credit_application" },
      { message: "Hello", intent: "general" },
      { message: "What services do you offer?", intent: "general" },
      
      // Edge cases
      { message: "Check credits for CUST999.", intent: "credit_balance_inquiry" },
      { message: "Apply $5000 credit for CUST001.", intent: "credit_application" },
      { message: "What's my balance?", intent: "credit_balance_inquiry" },
      { message: "Colorless green ideas sleep furiously.", intent: "general" }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n[${i + 1}/${testCases.length}] Testing: ${testCase.intent}`);
      
      const result = await this.sendMessage(testCase.message, testCase.intent);
      this.results.push(result);
      
      // Wait between tests
      await this.page.waitForTimeout(1000);
    }
  }

  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const successCount = this.results.filter(r => r.success).length;
    const failureCount = this.results.filter(r => !r.success).length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length;
    
    const report = {
      summary: {
        totalTests: this.results.length,
        successCount,
        failureCount,
        successRate: (successCount / this.results.length * 100).toFixed(2) + '%',
        avgResponseTime: Math.round(avgResponseTime) + 'ms',
        totalTestTime: Math.round(totalTime / 1000) + 's'
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };
    
    // Save report
    const reportPath = path.join(__dirname, 'simple-stress-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 SIMPLIFIED STRESS TEST REPORT');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Success: ${report.summary.successCount} (${report.summary.successRate})`);
    console.log(`Failures: ${report.summary.failureCount}`);
    console.log(`Average Response Time: ${report.summary.avgResponseTime}`);
    console.log(`Total Test Time: ${report.summary.totalTestTime}`);
    
    // Show individual results
    console.log('\n📋 INDIVIDUAL RESULTS');
    console.log('='.repeat(50));
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} [${index + 1}] ${result.message} (${result.responseTime}ms)`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.hasCollapsibleDetails) {
        console.log(`   📋 Has collapsible details`);
      }
    });
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Direct API testing function
async function testBackendDirectly() {
  console.log('\n🔧 DIRECT BACKEND API TESTING');
  console.log('='.repeat(50));
  
  const testCases = [
    { message: "What is the credit balance for CUST001?", intent: "credit_balance_inquiry" },
    { message: "Show me the credits for John Smith.", intent: "credit_balance_inquiry" },
    { message: "Apply $100 of credit for CUST001 to invoice INV001.", intent: "credit_application" },
    { message: "Hello", intent: "general" },
    { message: "Check credits for CUST999.", intent: "credit_balance_inquiry" }
  ];

  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\n📤 Testing: "${testCase.message}"`);
    const startTime = Date.now();
    
    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testCase.message,
          context: null
        })
      });
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      console.log(`📥 Response (${responseTime}ms): ${data.message ? 'Success' : 'No message'}`);
      console.log(`   Type: ${data.type || 'unknown'}`);
      console.log(`   Has Details: ${data.message && data.message.includes('---DETAILS---') ? 'Yes' : 'No'}`);
      
      results.push({
        message: testCase.message,
        intent: testCase.intent,
        success: !!data.message,
        responseTime,
        type: data.type,
        hasDetails: data.message && data.message.includes('---DETAILS---'),
        response: data.message ? data.message.substring(0, 100) + '...' : 'No response'
      });
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`❌ Error (${responseTime}ms): ${error.message}`);
      
      results.push({
        message: testCase.message,
        intent: testCase.intent,
        success: false,
        responseTime,
        error: error.message
      });
    }
  }
  
  return results;
}

// Main execution
async function runStressTest() {
  console.log('🎯 COMPREHENSIVE STRESS TEST STARTING...');
  
  // Test 1: Direct API testing
  const apiResults = await testBackendDirectly();
  
  // Test 2: Frontend testing
  const frontendTest = new SimpleStressTest();
  let frontendResults = [];
  
  try {
    await frontendTest.setup();
    await frontendTest.runTests();
    const frontendReport = frontendTest.generateReport();
    frontendResults = frontendReport.results;
  } catch (error) {
    console.log('❌ Frontend test failed:', error.message);
  } finally {
    await frontendTest.cleanup();
  }
  
  // Combined report
  console.log('\n🎯 FINAL COMPREHENSIVE REPORT');
  console.log('='.repeat(60));
  
  const apiSuccess = apiResults.filter(r => r.success).length;
  const frontendSuccess = frontendResults.filter(r => r.success).length;
  
  console.log(`\n📊 API Testing Results:`);
  console.log(`   Success: ${apiSuccess}/${apiResults.length} (${(apiSuccess/apiResults.length*100).toFixed(1)}%)`);
  console.log(`   Average Response Time: ${Math.round(apiResults.reduce((sum, r) => sum + r.responseTime, 0) / apiResults.length)}ms`);
  
  console.log(`\n📊 Frontend Testing Results:`);
  console.log(`   Success: ${frontendSuccess}/${frontendResults.length} (${(frontendSuccess/frontendResults.length*100).toFixed(1)}%)`);
  if (frontendResults.length > 0) {
    console.log(`   Average Response Time: ${Math.round(frontendResults.reduce((sum, r) => sum + r.responseTime, 0) / frontendResults.length)}ms`);
  }
  
  // Save combined report
  const combinedReport = {
    timestamp: new Date().toISOString(),
    api: {
      results: apiResults,
      summary: {
        total: apiResults.length,
        success: apiSuccess,
        successRate: (apiSuccess/apiResults.length*100).toFixed(1) + '%'
      }
    },
    frontend: {
      results: frontendResults,
      summary: {
        total: frontendResults.length,
        success: frontendSuccess,
        successRate: frontendResults.length > 0 ? (frontendSuccess/frontendResults.length*100).toFixed(1) + '%' : '0%'
      }
    }
  };
  
  const reportPath = path.join(__dirname, 'comprehensive-stress-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(combinedReport, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return combinedReport;
}

// Export for use in other files
module.exports = { SimpleStressTest, testBackendDirectly, runStressTest };

// Run if called directly
if (require.main === module) {
  runStressTest().catch(console.error);
}
