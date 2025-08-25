require('dotenv').config({ path: '../.env' });
const { extractInfoWithLLM } = require('../server/services/aiService');

/**
 * Test Llama model consistency
 */
async function testLlamaConsistency() {
  console.log('🧪 Testing Llama Model Consistency...');
  
  try {
    const testMessages = [
      'What is the credit balance for CUST001?',
      'Apply $5 credit from CUST001 to invoice INV005',
      'Apply $5 credit from CUST001 to invoice INV001'
    ];
    
    for (const message of testMessages) {
      console.log(`\n📝 Testing: "${message}"`);
      
      // Test the same message 3 times to check consistency
      for (let i = 1; i <= 3; i++) {
        try {
          const result = await extractInfoWithLLM(message, 'ollama/llama3.2:3b');
          console.log(`  Attempt ${i}:`, {
            intent: result.intent,
            customerName: result.customerName,
            customerId: result.customerId,
            creditAmount: result.creditAmount,
            invoiceId: result.invoiceId
          });
        } catch (error) {
          console.log(`  Attempt ${i}: ERROR -`, error.message);
        }
      }
    }
    
    console.log('\n🎉 Llama consistency test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLlamaConsistency();
