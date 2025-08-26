require('dotenv').config({ path: '../.env' });
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');
const { ClarifyingRAGAgent } = require('../server/services/agentService');

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const useGemini = args.includes('--gemini');
  const model = useGemini ? 'gemini-2.5-flash-lite' : 'ollama/llama3.2:3b';

  console.log(`🤖 Using AI Model: ${model}`);
  return { model, useGemini };
}

/**
 * Test purchase history functionality
 */
async function testPurchaseHistory() {
  const { model } = parseArgs();
  console.log('🧪 Testing Purchase History Functionality...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    const testCases = [
      {
        name: 'Direct Customer Name',
        message: 'Show me purchase history for Sarah Johnson',
        expectedIntent: 'purchase_history',
        expectedType: 'success',
        shouldWork: true
      },
      {
        name: 'Customer ID Pattern',
        message: 'What has CUST005 bought?',
        expectedIntent: 'purchase_history',
        expectedType: 'error', // CUST005 doesn't exist
        shouldWork: true
      },
      {
        name: 'Ambiguous Customer - Should Clarify',
        message: 'Show me history for John',
        expectedIntent: 'purchase_history',
        expectedType: 'clarification_needed',
        shouldWork: true
      },
      {
        name: 'Different Phrasing',
        message: 'What did Sarah Johnson purchase?',
        expectedIntent: 'purchase_history',
        expectedType: 'success',
        shouldWork: true
      },
      {
        name: 'History Keyword',
        message: 'Purchase history for CUST001',
        expectedIntent: 'purchase_history',
        expectedType: 'success',
        shouldWork: true
      }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n[${i + 1}/${testCases.length}] Testing: ${testCase.name}`);
      console.log(`Message: "${testCase.message}"`);
      console.log(`Expected: ${testCase.expectedIntent} → ${testCase.expectedType}`);
      console.log('='.repeat(70));
      
      const agent = new ClarifyingRAGAgent(`test-purchase-${i}`);
      const result = await agent.processRequest(testCase.message, model);
      
      console.log('🤖 Result Type:', result.type);
      console.log('🤖 Agent State:', result.agentState);
      
      // Check intent detection (look for clues in the debug output)
      let detectedIntent = 'unknown';
      if (result.type === 'success' && result.message.includes('Purchase History for')) {
        detectedIntent = 'purchase_history';
      } else if (result.type === 'clarification_needed' && result.message.includes('customers matching')) {
        detectedIntent = 'purchase_history'; // Correct clarification
      } else if (result.type === 'error' && result.message.includes('Customer not found')) {
        detectedIntent = 'purchase_history'; // Correct error handling
      } else if (result.type === 'confirmation_needed' && result.message.includes('Credit Balance')) {
        detectedIntent = 'credit_balance_inquiry'; // Wrong intent
      } else if (result.message && result.message.includes('not yet implemented')) {
        detectedIntent = 'unknown'; // Not implemented
      }
      
      // Evaluate results
      const intentCorrect = detectedIntent === testCase.expectedIntent;
      const typeCorrect = result.type === testCase.expectedType;
      
      if (intentCorrect && typeCorrect) {
        console.log('✅ PASS: Intent and type correct');
      } else if (intentCorrect && !typeCorrect) {
        console.log('🟡 PARTIAL: Intent correct, type wrong');
        console.log(`   Expected type: ${testCase.expectedType}, got: ${result.type}`);
      } else if (!intentCorrect) {
        console.log(`❌ FAIL: Wrong intent detected (${detectedIntent} instead of ${testCase.expectedIntent})`);
      }
      
      // Check for collapsible details in success cases
      if (result.type === 'success' && result.message && result.message.includes('---DETAILS---')) {
        console.log('✅ Collapsible Details: PASS');
      } else if (result.type === 'success') {
        console.log('❌ Collapsible Details: FAIL (missing for success response)');
      } else {
        console.log('⚪ Collapsible Details: N/A (not success response)');
      }
      
      // Show message preview
      console.log('📄 Message Preview:', result.message ? result.message.substring(0, 150) + '...' : 'No message');
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📋 SUMMARY');
    console.log('='.repeat(50));
    console.log('🔧 Purchase history functionality should now work');
    console.log('🔧 Intent detection improved for various phrasings');
    console.log('🔧 MongoDB database integration instead of Python microservice');
    console.log('🔧 Collapsible details section included');
    
    console.log('\n🎯 Expected Improvements:');
    console.log('✅ "Show me purchase history for Sarah Johnson" should work');
    console.log('✅ "What has CUST005 bought?" should work (with proper error)');
    console.log('✅ "Show me history for John" should clarify then show purchase history');
    console.log('✅ No more "Action type \'purchase_history\' is not yet implemented"');
    
    console.log('\n🎉 Purchase history test completed!');
    
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
testPurchaseHistory();
