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
    
    console.log('\n📝 Test 1: Customer ID lookup (CUST001)');
    console.log('User: "What is the credit balance for CUST001?"');

    const result1 = await agent.processRequest(
      'What is the credit balance for CUST001?',
      'gemini-2.5-flash-lite'
    );
    
    console.log('🤖 Agent Response:');
    console.log('Type:', result1.type);
    console.log('State:', result1.agentState);
    console.log('Message:', result1.message);
    
    if (result1.type === 'success') {
      console.log('\n✅ Customer ID lookup working correctly!');

      // Test 2: Insufficient credits
      console.log('\n📝 Test 2: Insufficient credits test');
      console.log('User: "Apply $10000 credit for CUST001 to invoice INV001"');

      const agent2 = new ClarifyingRAGAgent('test-session-456');
      const result2 = await agent2.processRequest('Apply $10000 credit for CUST001 to invoice INV001', 'gemini-2.5-flash-lite');

      console.log('🤖 Agent Response:');
      console.log('Type:', result2.type);
      console.log('State:', result2.agentState);
      console.log('Message:', result2.message.substring(0, 200) + '...');

      if (result2.type === 'insufficient_credits') {
        console.log('\n✅ Insufficient credits detected correctly!');
      }

      // Test 3: Invoice validation
      console.log('\n📝 Test 3: Invoice validation test');
      console.log('User: "Apply $100 to INV999 for CUST001"');

      const agent3 = new ClarifyingRAGAgent('test-session-789');
      const result3 = await agent3.processRequest('Apply $100 to INV999 for CUST001', 'gemini-2.5-flash-lite');

      console.log('🤖 Agent Response:');
      console.log('Type:', result3.type);
      console.log('State:', result3.agentState);
      console.log('Message:', result3.message.substring(0, 200) + '...');

      if (result3.type === 'error') {
        console.log('\n✅ Invoice validation working correctly!');
      }
    } else {
      console.log('\n❌ Customer ID lookup failed');
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
