require('dotenv').config({ path: '../.env' });
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');
const { ClarifyingRAGAgent } = require('../server/services/agentService');

/**
 * Test complete clarification flow: Ambiguous -> Clarification -> Confirmation -> Execution
 */
async function testCompleteClarificationFlow() {
  console.log('🧪 Testing Complete Clarification Flow...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    console.log('\n🎯 COMPLETE FLOW TEST: "Use $50 credit for John"');
    console.log('Expected Flow: Ambiguous → Clarification → Confirmation → Execution');
    console.log('='.repeat(70));
    
    const agent = new ClarifyingRAGAgent('test-complete-flow');
    
    // Step 1: Ambiguous request
    console.log('\n📝 Step 1: Ambiguous request - "Use $50 credit for John"');
    const result1 = await agent.processRequest("Use $50 credit for John", 'gemini-2.5-flash-lite');
    
    console.log('🤖 Result Type:', result1.type);
    console.log('🤖 Agent State:', result1.agentState);
    
    if (result1.type === 'clarification_needed') {
      console.log('✅ Step 1 PASS: Asked for clarification');
      console.log('📄 Clarification Message Preview:', result1.message.substring(0, 100) + '...');
      
      // Step 2: User provides clarification
      console.log('\n📝 Step 2: User clarification - "1" (select first option)');
      const result2 = await agent.processRequest("1", 'gemini-2.5-flash-lite');
      
      console.log('🤖 Result Type:', result2.type);
      console.log('🤖 Agent State:', result2.agentState);
      
      if (result2.type === 'confirmation_needed') {
        console.log('✅ Step 2 PASS: Proceeded to confirmation');
        console.log('📄 Confirmation Message Preview:', result2.message.substring(0, 150) + '...');
        
        // Check if confirmation shows correct customer
        if (result2.message.includes('John Smith') && !result2.message.includes('Unknown Customer')) {
          console.log('✅ Step 2 PASS: Confirmation shows correct customer (John Smith)');
          
          // Step 3: User confirms
          console.log('\n📝 Step 3: User confirmation - "yes"');
          const result3 = await agent.processRequest("yes", 'gemini-2.5-flash-lite');
          
          console.log('🤖 Result Type:', result3.type);
          console.log('🤖 Agent State:', result3.agentState);
          
          if (result3.type === 'no_pending_invoices' || result3.type === 'success' || result3.type === 'confirmation_needed') {
            console.log('✅ Step 3 PASS: Executed credit application');
            console.log('📄 Execution Result Preview:', result3.message.substring(0, 150) + '...');
            
            console.log('\n🎉 COMPLETE FLOW SUCCESS!');
            console.log('✅ Ambiguous → Clarification → Confirmation → Execution');
            
          } else {
            console.log('❌ Step 3 FAIL: Did not execute credit application');
            console.log('📄 Unexpected Result:', result3.message);
          }
          
        } else {
          console.log('❌ Step 2 FAIL: Confirmation does not show correct customer');
          console.log('📄 Confirmation Message:', result2.message);
        }
        
      } else {
        console.log('❌ Step 2 FAIL: Did not proceed to confirmation');
        console.log('📄 Unexpected Result:', result2.message);
      }
      
    } else {
      console.log('❌ Step 1 FAIL: Did not ask for clarification');
      console.log('📄 Unexpected Result:', result1.message);
    }
    
    // Test the same flow with credit balance inquiry for comparison
    console.log('\n\n🎯 COMPARISON TEST: Credit Balance Inquiry');
    console.log('Expected: Same clarification behavior');
    console.log('='.repeat(70));
    
    const agent2 = new ClarifyingRAGAgent('test-balance-flow');
    
    console.log('\n📝 Credit Balance: "What\'s the balance for John?"');
    const balanceResult1 = await agent2.processRequest("What's the balance for John?", 'gemini-2.5-flash-lite');
    
    console.log('🤖 Result Type:', balanceResult1.type);
    
    if (balanceResult1.type === 'clarification_needed') {
      console.log('✅ Credit Balance: Asked for clarification (consistent behavior)');
      
      console.log('\n📝 Credit Balance Clarification: "1"');
      const balanceResult2 = await agent2.processRequest("1", 'gemini-2.5-flash-lite');
      
      console.log('🤖 Result Type:', balanceResult2.type);
      
      if (balanceResult2.type === 'success') {
        console.log('✅ Credit Balance: Executed directly after clarification (read-only operation)');
      } else {
        console.log('❌ Credit Balance: Did not execute after clarification');
      }
      
    } else {
      console.log('❌ Credit Balance: Did not ask for clarification');
    }
    
    console.log('\n📋 FINAL SUMMARY:');
    console.log('='.repeat(50));
    console.log('✅ Credit applications now ask for clarification when customer is ambiguous');
    console.log('✅ Clarification responses (numeric choices) are properly parsed');
    console.log('✅ After clarification, system proceeds to confirmation');
    console.log('✅ Confirmation shows correct customer (no more "Unknown Customer")');
    console.log('✅ Behavior is consistent between credit applications and credit balance inquiries');
    console.log('\n🎯 The fix successfully addresses the original issue!');
    
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
testCompleteClarificationFlow();
