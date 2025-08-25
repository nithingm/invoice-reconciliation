require('dotenv').config({ path: '../.env' });
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');

/**
 * Test the specific issues mentioned by the user
 */
async function testSpecificIssues() {
  console.log('🧪 Testing Specific Issues...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Test Issue 2: Apply $5 credits from CUST001 to invoice INV001
    console.log('\n📝 Issue 2 Test: Apply $5 credits from CUST001 to invoice INV001');
    const agent1 = new ClarifyingRAGAgent('issue-test-1');
    const result1 = await agent1.processRequest('Apply $5 credits from CUST001 to invoice INV001', 'gemini-2.5-flash-lite');
    
    console.log('🤖 Response Type:', result1.type);
    console.log('🤖 Response State:', result1.agentState);
    console.log('🤖 Response Message Preview:', result1.message.substring(0, 200));
    
    if (result1.message.includes('John Smith') && result1.message.includes('CUST001')) {
      console.log('✅ Issue 2: Customer correctly identified as John Smith (CUST001)');
    } else {
      console.log('❌ Issue 2: Customer not correctly identified');
    }
    
    if (result1.message.includes('$5')) {
      console.log('✅ Issue 2: Credit amount correctly shown as $5');
    } else {
      console.log('❌ Issue 2: Credit amount not correctly shown');
    }
    
    // Test Issue 3: Apply $20 credit for Lisa Chen
    console.log('\n📝 Issue 3 Test: Apply $20 credit for Lisa Chen');
    const agent2 = new ClarifyingRAGAgent('issue-test-2');
    const result2 = await agent2.processRequest('Apply $20 credit for Lisa Chen', 'gemini-2.5-flash-lite');
    
    console.log('🤖 Response Type:', result2.type);
    console.log('🤖 Response State:', result2.agentState);
    console.log('🤖 Response Message Preview:', result2.message.substring(0, 200));
    
    if (result2.type === 'confirmation_needed' && result2.message.includes('Apply Credits Confirmation')) {
      console.log('✅ Issue 3: Correctly identified as credit application, not quantity discrepancy');
    } else {
      console.log('❌ Issue 3: Wrong intent detection');
    }
    
    // Test Issue 4: Apply $10000 credit for CUST001 to invoice INV001
    console.log('\n📝 Issue 4 Test: Apply $10000 credit for CUST001 to invoice INV001');
    const agent3 = new ClarifyingRAGAgent('issue-test-3');
    const result3 = await agent3.processRequest('Apply $10000 credit for CUST001 to invoice INV001', 'gemini-2.5-flash-lite');
    
    console.log('🤖 Response Type:', result3.type);
    console.log('🤖 Response State:', result3.agentState);
    console.log('🤖 Response Message Preview:', result3.message.substring(0, 200));
    
    if (result3.type === 'insufficient_credits' && result3.message.includes('John Smith') && result3.message.includes('CUST001')) {
      console.log('✅ Issue 4: Correctly shows insufficient credits for John Smith (CUST001)');
    } else {
      console.log('❌ Issue 4: Wrong customer or not showing insufficient credits');
    }
    
    if (result3.message.includes('$10000') && result3.message.includes('$470')) {
      console.log('✅ Issue 4: Correctly shows requested ($10000) vs available ($470)');
    } else {
      console.log('❌ Issue 4: Credit amounts not correctly shown');
    }
    
    console.log('\n🎉 Specific issues test completed!');
    
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
testSpecificIssues();
