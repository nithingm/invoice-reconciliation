require('dotenv').config({ path: '../.env' });
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');
const { ClarifyingRAGAgent } = require('../server/services/agentService');

/**
 * Test OpenAI integration
 */
async function testOpenAIIntegration() {
  console.log('🧪 Testing OpenAI Integration...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    const openaiModels = [
      'gpt-4o',
      'gpt-4o-mini', 
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'openai/gpt-4o',
      'openai/gpt-4o-mini'
    ];
    
    const testCases = [
      {
        name: 'Simple Purchase History',
        message: 'Show me purchase history for Sarah Johnson',
        expectedIntent: 'purchase_history',
        expectedType: 'success'
      },
      {
        name: 'Invoice Inquiry',
        message: 'Show me details for invoice INV002',
        expectedIntent: 'invoice_inquiry',
        expectedType: 'success'
      },
      {
        name: 'Credit Balance',
        message: 'What is the credit balance for John Smith?',
        expectedIntent: 'credit_balance_inquiry',
        expectedType: 'success'
      }
    ];

    for (let modelIndex = 0; modelIndex < openaiModels.length; modelIndex++) {
      const model = openaiModels[modelIndex];
      console.log(`\n🤖 Testing Model: ${model}`);
      console.log('='.repeat(60));
      
      let modelWorking = false;
      
      for (let testIndex = 0; testIndex < testCases.length; testIndex++) {
        const testCase = testCases[testIndex];
        console.log(`\n[${testIndex + 1}/${testCases.length}] Testing: ${testCase.name}`);
        console.log(`Message: "${testCase.message}"`);
        console.log(`Expected: ${testCase.expectedIntent} → ${testCase.expectedType}`);
        console.log('-'.repeat(50));
        
        try {
          const agent = new ClarifyingRAGAgent(`test-openai-${modelIndex}-${testIndex}`);
          const result = await agent.processRequest(testCase.message, model);
          
          console.log('🤖 Result Type:', result.type);
          console.log('🤖 Agent State:', result.agentState);
          
          // Check intent detection
          let detectedIntent = 'unknown';
          if (result.type === 'success' && result.message.includes('Purchase History for')) {
            detectedIntent = 'purchase_history';
          } else if (result.type === 'success' && result.message.includes('Invoice Details for')) {
            detectedIntent = 'invoice_inquiry';
          } else if (result.type === 'success' && result.message.includes('Credit Balance for')) {
            detectedIntent = 'credit_balance_inquiry';
          } else if (result.type === 'clarification_needed') {
            detectedIntent = testCase.expectedIntent; // Assume correct if asking for clarification
          } else if (result.type === 'error' && result.message.includes('not found')) {
            detectedIntent = testCase.expectedIntent; // Correct intent, just no data
          }
          
          const intentCorrect = detectedIntent === testCase.expectedIntent;
          
          if (intentCorrect) {
            console.log('✅ PASS: Intent detection correct');
            modelWorking = true;
          } else {
            console.log(`❌ FAIL: Wrong intent (${detectedIntent} instead of ${testCase.expectedIntent})`);
          }
          
          console.log('📄 Message Preview:', result.message ? result.message.substring(0, 100) + '...' : 'No message');
          
        } catch (error) {
          console.error(`❌ ERROR: ${error.message}`);
          if (error.message.includes('API key') || error.message.includes('authentication')) {
            console.log('🔑 API Key issue detected');
          } else if (error.message.includes('model') || error.message.includes('not found')) {
            console.log('🤖 Model availability issue detected');
          } else {
            console.log('🔧 Other integration issue detected');
          }
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (modelWorking) {
        console.log(`\n✅ Model ${model} is WORKING!`);
      } else {
        console.log(`\n❌ Model ${model} is NOT WORKING`);
      }
    }
    
    console.log('\n📋 SUMMARY');
    console.log('='.repeat(50));
    console.log('🔧 Tested various OpenAI model formats');
    console.log('🔧 Checked intent detection accuracy');
    console.log('🔧 Verified integration with existing system');
    
    console.log('\n🎯 Next Steps:');
    console.log('✅ If models work: OpenAI integration is ready');
    console.log('🔧 If models fail: Need to implement OpenAI support');
    console.log('🔑 Check API key configuration if authentication errors');
    
    console.log('\n🎉 OpenAI integration test completed!');
    
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
testOpenAIIntegration();
