const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Playwright stress test for the invoice reconciliation system
 */
class StressTestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
    this.startTime = Date.now();
  }

  async setup() {
    console.log('🚀 Setting up Playwright stress test...');
    this.browser = await chromium.launch({
      headless: true, // Run headless for automated testing
      slowMo: 100 // Minimal slow down
    });
    this.page = await this.browser.newPage();

    // Set viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });

    // Navigate to the application
    console.log('📍 Navigating to http://localhost:3000...');
    await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Wait for React to load
    await this.page.waitForTimeout(2000);

    // Try multiple selectors to open chat
    console.log('🔍 Looking for chat toggle...');
    try {
      // Try different possible selectors for the chat toggle
      const chatSelectors = [
        '[data-testid="chat-toggle"]',
        'button:has-text("💬")',
        'button:has-text("Chat")',
        '.chat-toggle',
        '[aria-label*="chat"]',
        'button[title*="chat"]'
      ];

      let chatOpened = false;
      for (const selector of chatSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2000 });
          await this.page.click(selector);
          chatOpened = true;
          console.log(`✅ Chat opened using selector: ${selector}`);
          break;
        } catch (e) {
          console.log(`❌ Selector failed: ${selector}`);
        }
      }

      if (!chatOpened) {
        // Try to find any button that might open chat
        const buttons = await this.page.$$('button');
        for (const button of buttons) {
          const text = await button.textContent();
          if (text && (text.includes('💬') || text.toLowerCase().includes('chat'))) {
            await button.click();
            chatOpened = true;
            console.log(`✅ Chat opened using button with text: ${text}`);
            break;
          }
        }
      }

      if (!chatOpened) {
        throw new Error('Could not find chat toggle button');
      }

    } catch (error) {
      console.log('⚠️ Could not open chat sidebar automatically. Continuing with test...');
      console.log('Error:', error.message);
    }

    await this.page.waitForTimeout(1000);
    console.log('✅ Setup complete');
  }

  async sendMessage(message, expectedType = null, timeout = 30000) {
    console.log(`📤 Sending: "${message}"`);
    
    const startTime = Date.now();
    
    try {
      // Find and fill the input field - try multiple selectors
      const inputSelectors = [
        'input[placeholder*="message"]',
        'input[placeholder*="Type"]',
        'input[type="text"]',
        'textarea[placeholder*="message"]',
        '.chat-input input',
        'form input[type="text"]'
      ];

      let inputFound = false;
      let inputSelector = null;

      for (const selector of inputSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2000 });
          inputSelector = selector;
          inputFound = true;
          break;
        } catch (e) {
          // Try next selector
        }
      }

      if (!inputFound) {
        throw new Error('Could not find chat input field');
      }

      await this.page.fill(inputSelector, message);

      // Send the message
      await this.page.press(inputSelector, 'Enter');
      
      // Wait for response
      await this.page.waitForTimeout(2000); // Initial wait
      
      // Wait for typing indicator to disappear
      try {
        await this.page.waitForSelector('text="AI is typing"', { timeout: 5000 });
        await this.page.waitForSelector('text="AI is typing"', { state: 'detached', timeout });
      } catch (e) {
        // Typing indicator might not appear for fast responses
      }
      
      // Get the latest response
      const messages = await this.page.$$eval('.space-y-4 > div', (elements) => {
        return elements.map(el => ({
          text: el.textContent,
          isBot: el.querySelector('[data-testid="ai-assistant"], .text-gray-600:has-text("AI Assistant")') !== null,
          hasDetails: el.textContent.includes('Technical Details') || el.textContent.includes('Details'),
          hasCollapsible: el.querySelector('button:has-text("▶"), button:has-text("▼")') !== null
        }));
      });
      
      const botMessages = messages.filter(m => m.isBot);
      const latestResponse = botMessages[botMessages.length - 1];
      
      const responseTime = Date.now() - startTime;
      
      const result = {
        message,
        response: latestResponse?.text || 'No response received',
        responseTime,
        hasDetails: latestResponse?.hasDetails || false,
        hasCollapsible: latestResponse?.hasCollapsible || false,
        expectedType,
        success: true,
        timestamp: new Date().toISOString()
      };
      
      console.log(`📥 Response (${responseTime}ms): ${result.response.substring(0, 100)}...`);
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`❌ Error (${responseTime}ms): ${error.message}`);
      
      return {
        message,
        response: `Error: ${error.message}`,
        responseTime,
        hasDetails: false,
        hasCollapsible: false,
        expectedType,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async runTestSuite() {
    console.log('🧪 Starting comprehensive stress test...');
    
    const testCases = [
      // 1. Credit Balance Inquiry
      { message: "What is the credit balance for CUST001?", intent: "credit_balance_inquiry", category: "Credit Balance" },
      { message: "Show me the credits for John Smith.", intent: "credit_balance_inquiry", category: "Credit Balance" },
      { message: "What's the balance for John?", intent: "credit_balance_inquiry", category: "Credit Balance (Ambiguous)" },
      { message: "What's my balance?", intent: "credit_balance_inquiry", category: "Credit Balance (No Customer)" },
      { message: "Check credits for CUST999.", intent: "credit_balance_inquiry", category: "Credit Balance (Invalid)" },
      
      // 2. Credit Application
      { message: "Apply $100 of credit for CUST001 to invoice INV001.", intent: "credit_application", category: "Credit Application" },
      { message: "Use $200 of credit for Lisa Chen.", intent: "credit_application", category: "Credit Application (Smart)" },
      { message: "Use $50 credit for John.", intent: "credit_application", category: "Credit Application (Ambiguous)" },
      { message: "Apply $5000 credit for CUST001.", intent: "credit_application", category: "Credit Application (Insufficient)" },
      { message: "Apply $500 credit to invoice INV005.", intent: "credit_application", category: "Credit Application (Exceeds Balance)" },
      
      // 3. Invoice Inquiry
      { message: "Show me the details for invoice INV002.", intent: "invoice_inquiry", category: "Invoice Inquiry" },
      { message: "What's the status of INV003?", intent: "invoice_inquiry", category: "Invoice Inquiry" },
      { message: "Pull up invoice INV999.", intent: "invoice_inquiry", category: "Invoice Inquiry (Invalid)" },
      
      // 4. Purchase History
      { message: "Show me the purchase history for Sarah Johnson.", intent: "purchase_history", category: "Purchase History" },
      { message: "What has CUST005 bought?", intent: "purchase_history", category: "Purchase History" },
      { message: "Show me the history for John.", intent: "purchase_history", category: "Purchase History (Ambiguous)" },
      
      // 5. Quantity Discrepancy
      { message: "We were short 5 units of the 'Standard Rebuild Kit' on invoice INV001.", intent: "quantity_discrepancy", category: "Quantity Discrepancy" },
      { message: "We were missing 10 items on invoice INV003.", intent: "quantity_discrepancy", category: "Quantity Discrepancy (Vague Item)" },
      { message: "We had a quantity discrepancy for CUST001.", intent: "quantity_discrepancy", category: "Quantity Discrepancy (Vague Invoice)" },
      
      // 6. Damage Report
      { message: "The 'Torque Converter' on invoice INV002 arrived damaged.", intent: "damage_report", category: "Damage Report" },
      { message: "Something was broken in our last shipment for CUST004.", intent: "damage_report", category: "Damage Report (Vague)" },
      
      // 7. Partial Payment
      { message: "We made a partial payment of $4000 on invoice INV003 for Mike Wilson.", intent: "partial_payment", category: "Partial Payment" },
      { message: "I paid $6000 for invoice INV005.", intent: "partial_payment", category: "Partial Payment (Exceeds Balance)" },
      
      // 8. General/Fallback
      { message: "Hello", intent: "general", category: "General (Greeting)" },
      { message: "What services do you offer?", intent: "general", category: "General (Question)" },
      { message: "Colorless green ideas sleep furiously.", intent: "general", category: "General (Nonsense)" }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n[${i + 1}/${testCases.length}] Testing: ${testCase.category}`);
      
      const result = await this.sendMessage(testCase.message, testCase.intent);
      result.category = testCase.category;
      result.intent = testCase.intent;
      
      this.results.push(result);
      
      // Wait between tests to avoid overwhelming the system
      await this.page.waitForTimeout(2000);
    }
  }

  async generateReport() {
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
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'stress-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 STRESS TEST REPORT');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Success: ${report.summary.successCount} (${report.summary.successRate})`);
    console.log(`Failures: ${report.summary.failureCount}`);
    console.log(`Average Response Time: ${report.summary.avgResponseTime}`);
    console.log(`Total Test Time: ${report.summary.totalTestTime}`);
    console.log(`\nDetailed report saved to: ${reportPath}`);
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run the stress test
async function runStressTest() {
  const runner = new StressTestRunner();
  
  try {
    await runner.setup();
    await runner.runTestSuite();
    const report = await runner.generateReport();
    
    // Print detailed results
    console.log('\n📋 DETAILED RESULTS BY CATEGORY');
    console.log('='.repeat(50));
    
    const categories = [...new Set(runner.results.map(r => r.category))];
    categories.forEach(category => {
      const categoryResults = runner.results.filter(r => r.category === category);
      const categorySuccess = categoryResults.filter(r => r.success).length;
      console.log(`\n${category}: ${categorySuccess}/${categoryResults.length} passed`);
      
      categoryResults.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`  ${status} ${result.message} (${result.responseTime}ms)`);
        if (!result.success) {
          console.log(`     Error: ${result.error}`);
        }
      });
    });
    
    return report;
    
  } catch (error) {
    console.error('❌ Stress test failed:', error);
    throw error;
  } finally {
    await runner.cleanup();
  }
}

// Export for use in other files
module.exports = { StressTestRunner, runStressTest };

// Run if called directly
if (require.main === module) {
  runStressTest().catch(console.error);
}
