/**
 * Test Clarifying RAG Agent
 * This tests the new agent's ability to handle ambiguity and confirmations
 */

require('dotenv').config({ path: '../.env' });
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');

async function testClarifyingAgent() {
  console.log('🧪 Testing Clarifying RAG Agent...');

  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');

    // Create a new agent instance
    const agent = new ClarifyingRAGAgent('test-session-123');
    
    console.log('\n📝 Test 1: Apply $5 credits from CUST001 to invoice INV001');
    console.log('User: "Apply $5 credits from CUST001 to invoice INV001"');

    const result1 = await agent.processRequest(
      'Apply $5 credits from CUST001 to invoice INV001',
      'gemini-2.5-flash-lite'
    );
    
    console.log('🤖 Agent Response:');
    console.log('Type:', result1.type);
    console.log('State:', result1.agentState);
    console.log('Message:', result1.message);
    
    console.log('🤖 Agent Response:');
    console.log('Type:', result1.type);
    console.log('State:', result1.agentState);
    console.log('Message:', result1.message.substring(0, 300) + '...');

    if (result1.type === 'error' && result1.message.includes('Invoice INV001 not found')) {
      console.log('\n✅ Test 1 passed: Invoice validation working correctly!');
    } else if (result1.type === 'confirmation_needed') {
      console.log('\n❌ Test 1 failed: Should show invoice error, not ask for confirmation');
    }

    // Test 2: Intent detection for Lisa Chen
    console.log('\n📝 Test 2: Apply 20$ credit for Lisa Chen');
    console.log('User: "Apply 20$ credit for Lisa Chen"');

    const agent2 = new ClarifyingRAGAgent('test-session-456');
    const result2 = await agent2.processRequest('Apply 20$ credit for Lisa Chen', 'gemini-2.5-flash-lite');

    console.log('🤖 Agent Response:');
    console.log('Type:', result2.type);
    console.log('State:', result2.agentState);
    console.log('Message:', result2.message.substring(0, 300) + '...');

    if (result2.type === 'confirmation_needed' && result2.message.includes('Apply Credits Confirmation')) {
      console.log('\n✅ Test 2 passed: Correct intent detection for credit application!');
    } else {
      console.log('\n❌ Test 2 failed: Wrong intent detection');
    }

    // Test 3: Customer ID resolution in confirmation
    console.log('\n📝 Test 3: Customer ID resolution in confirmation');
    console.log('User: "Apply $100 to INV008 for CUST001"');

    const agent3 = new ClarifyingRAGAgent('test-session-789');
    const result3 = await agent3.processRequest('Apply $100 to INV008 for CUST001', 'gemini-2.5-flash-lite');

    console.log('🤖 Agent Response:');
    console.log('Type:', result3.type);
    console.log('State:', result3.agentState);
    console.log('Message:', result3.message.substring(0, 300) + '...');

    if (result3.type === 'confirmation_needed' && result3.message.includes('John Smith') && result3.message.includes('CUST001')) {
      console.log('\n✅ Test 3 passed: Customer ID resolution working correctly!');
    } else {
      console.log('\n❌ Test 3 failed: Customer ID not resolved correctly');
    }
    
    console.log('\n🎉 Clarifying RAG Agent test completed successfully!');

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
testClarifyingAgent().catch(console.error);
