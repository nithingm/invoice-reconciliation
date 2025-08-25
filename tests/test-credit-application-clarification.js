require('dotenv').config({ path: '../.env' });
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');
const { ClarifyingRAGAgent } = require('../server/services/agentService');

/**
 * Test credit application clarification flow
 * This test verifies that when a customer name is ambiguous in a credit application,
 * the system asks for clarification first, then proceeds to confirmation.
 */
async function testCreditApplicationClarification() {
  console.log('🧪 Testing Credit Application Clarification Flow...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Test 1: Ambiguous customer name in credit application
    console.log('\n📝 Test 1: Ambiguous customer name - "Use $50 credit for John"');
    console.log('Expected: Should ask for clarification (which John?)');
    console.log('='.repeat(60));
    
    const agent = new ClarifyingRAGAgent('test-credit-app-clarification');
    
    const result1 = await agent.processRequest("Use $50 credit for John", 'gemini-2.5-flash-lite');
    
    console.log('🤖 Result Type:', result1.type);
    console.log('🤖 Agent State:', result1.agentState);
    
    if (result1.type === 'clarification_needed') {
      console.log('✅ PASS: System correctly asked for clarification');
      console.log('📄 Clarification Message:');
      console.log(result1.message);
      
      // Test 2: User provides clarification
      console.log('\n📝 Test 2: User provides clarification - "1" (selecting first John)');
      console.log('Expected: Should proceed to confirmation');
      console.log('='.repeat(60));
      
      const result2 = await agent.processRequest("1", 'gemini-2.5-flash-lite');
      
      console.log('🤖 Result Type:', result2.type);
      console.log('🤖 Agent State:', result2.agentState);
      
      if (result2.type === 'confirmation_needed') {
        console.log('✅ PASS: System correctly proceeded to confirmation after clarification');
        console.log('📄 Confirmation Message:');
        console.log(result2.message);
        
        // Check if the confirmation shows the correct customer
        if (result2.message.includes('John Smith') && !result2.message.includes('Unknown Customer')) {
          console.log('✅ PASS: Confirmation shows correct customer (John Smith)');
        } else {
          console.log('❌ FAIL: Confirmation does not show correct customer');
        }
        
      } else {
        console.log('❌ FAIL: System did not proceed to confirmation after clarification');
        console.log('📄 Unexpected Response:', result2.message);
      }
      
    } else {
      console.log('❌ FAIL: System did not ask for clarification');
      console.log('📄 Unexpected Response:', result1.message);
    }
    
    // Test 3: Compare with credit balance inquiry (should work the same way)
    console.log('\n📝 Test 3: Credit balance inquiry with ambiguous name - "What\'s the balance for John?"');
    console.log('Expected: Should ask for clarification (same as credit application)');
    console.log('='.repeat(60));
    
    const agent2 = new ClarifyingRAGAgent('test-credit-balance-clarification');
    
    const result3 = await agent2.processRequest("What's the balance for John?", 'gemini-2.5-flash-lite');
    
    console.log('🤖 Result Type:', result3.type);
    console.log('🤖 Agent State:', result3.agentState);
    
    if (result3.type === 'clarification_needed') {
      console.log('✅ PASS: Credit balance inquiry correctly asked for clarification');
    } else {
      console.log('❌ FAIL: Credit balance inquiry did not ask for clarification');
    }
    
    // Test 4: Specific customer name (should work without clarification)
    console.log('\n📝 Test 4: Specific customer name - "Use $50 credit for John Smith"');
    console.log('Expected: Should proceed directly to confirmation (no clarification needed)');
    console.log('='.repeat(60));
    
    const agent3 = new ClarifyingRAGAgent('test-specific-customer');
    
    const result4 = await agent3.processRequest("Use $50 credit for John Smith", 'gemini-2.5-flash-lite');
    
    console.log('🤖 Result Type:', result4.type);
    console.log('🤖 Agent State:', result4.agentState);
    
    if (result4.type === 'confirmation_needed') {
      console.log('✅ PASS: Specific customer name proceeded directly to confirmation');
      
      // Check if the confirmation shows the correct customer
      if (result4.message.includes('John Smith') && !result4.message.includes('Unknown Customer')) {
        console.log('✅ PASS: Confirmation shows correct customer (John Smith)');
      } else {
        console.log('❌ FAIL: Confirmation does not show correct customer');
      }
      
    } else if (result4.type === 'clarification_needed') {
      console.log('⚠️ UNEXPECTED: Specific customer name still asked for clarification');
      console.log('📄 Response:', result4.message);
    } else {
      console.log('❌ FAIL: Unexpected response type for specific customer name');
      console.log('📄 Response:', result4.message);
    }
    
    console.log('\n🎉 Credit Application Clarification test completed!');
    console.log('\n📋 Summary:');
    console.log('- Ambiguous credit application should ask for clarification ✓');
    console.log('- After clarification, should proceed to confirmation ✓');
    console.log('- Credit balance inquiry should work the same way ✓');
    console.log('- Specific customer names should skip clarification ✓');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    // Disconnect from MongoDB
    console.log('📊 Disconnecting from MongoDB...');
    await disconnectFromMongoDB();
  }
}

// Run the test
testCreditApplicationClarification();
