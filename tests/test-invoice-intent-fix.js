require('dotenv').config({ path: '../.env' });
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');
const { ClarifyingRAGAgent } = require('../server/services/agentService');

/**
 * Test the specific problematic invoice inquiry phrases
 */
async function testInvoiceIntentFix() {
  console.log('🧪 Testing Invoice Intent Detection Fixes...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    const problematicCases = [
      {
        name: 'Working Case - Show me details',
        message: 'Show me details for invoice INV002',
        expectedIntent: 'invoice_inquiry',
        expectedType: 'success',
        shouldWork: true
      },
      {
        name: 'BROKEN - What\'s the status',
        message: "What's the status of INV003?",
        expectedIntent: 'invoice_inquiry',
        expectedType: 'success',
        shouldWork: false // Currently broken
      },
      {
        name: 'BROKEN - Pull up invoice',
        message: 'Pull up invoice INV001',
        expectedIntent: 'invoice_inquiry',
        expectedType: 'success',
        shouldWork: false // Currently broken
      },
      {
        name: 'Additional Test - Check invoice',
        message: 'Check invoice INV002',
        expectedIntent: 'invoice_inquiry',
        expectedType: 'success',
        shouldWork: true
      },
      {
        name: 'Additional Test - Invoice status',
        message: 'INV001 status',
        expectedIntent: 'invoice_inquiry',
        expectedType: 'success',
        shouldWork: true
      }
    ];

    for (let i = 0; i < problematicCases.length; i++) {
      const testCase = problematicCases[i];
      console.log(`\n[${i + 1}/${problematicCases.length}] Testing: ${testCase.name}`);
      console.log(`Message: "${testCase.message}"`);
      console.log(`Expected: ${testCase.expectedIntent} → ${testCase.expectedType}`);
      console.log('='.repeat(70));
      
      const agent = new ClarifyingRAGAgent(`test-intent-${i}`);
      const result = await agent.processRequest(testCase.message, 'gemini-2.5-flash-lite');
      
      console.log('🤖 Result Type:', result.type);
      console.log('🤖 Agent State:', result.agentState);
      
      // Check intent detection (look for clues in the debug output)
      let detectedIntent = 'unknown';
      if (result.type === 'success' && result.message.includes('Invoice Details')) {
        detectedIntent = 'invoice_inquiry';
      } else if (result.type === 'error' && result.message.includes('Invoice') && result.message.includes('not found')) {
        detectedIntent = 'invoice_inquiry';
      } else if (result.type === 'error' && result.message.includes('Customer not found')) {
        detectedIntent = 'credit_balance_inquiry'; // Wrong intent
      } else if (result.message && result.message.includes('Apply Credits Confirmation')) {
        detectedIntent = 'credit_application'; // Wrong intent
      }
      
      // Evaluate results
      const intentCorrect = detectedIntent === testCase.expectedIntent;
      const typeCorrect = result.type === testCase.expectedType;
      
      if (intentCorrect && typeCorrect) {
        console.log('✅ PASS: Intent and type correct');
      } else if (intentCorrect && !typeCorrect) {
        console.log('🟡 PARTIAL: Intent correct, type wrong');
      } else if (!intentCorrect) {
        console.log(`❌ FAIL: Wrong intent detected (${detectedIntent} instead of ${testCase.expectedIntent})`);
      }
      
      // Show message preview
      console.log('📄 Message Preview:', result.message ? result.message.substring(0, 100) + '...' : 'No message');
      
      // Check if this was expected to be broken
      if (!testCase.shouldWork && !intentCorrect) {
        console.log('🔧 Expected failure - this case was broken before the fix');
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📋 SUMMARY');
    console.log('='.repeat(50));
    console.log('🔧 Fixed pattern-based extraction to prioritize invoice inquiries');
    console.log('🔧 Added validation to switch to invoice_inquiry when invoice ID is found');
    console.log('🔧 Improved keyword matching for various invoice inquiry phrasings');
    
    console.log('\n🎯 Expected Improvements:');
    console.log('✅ "What\'s the status of INV003?" should now work');
    console.log('✅ "Pull up invoice INV001" should now work');
    console.log('✅ Any phrase with invoice ID should prefer invoice_inquiry');
    
    console.log('\n🎉 Invoice intent detection test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    // Disconnect from MongoDB
    console.log('\n📊 Disconnecting from MongoDB...');
    await disconnectFromMongoDB();
  }
}

// Run the test
testInvoiceIntentFix();
