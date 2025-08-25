require('dotenv').config({ path: '../.env' });
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');

/**
 * Test persistent session behavior like the live chat
 */
async function testPersistentSession() {
  console.log('🧪 Testing Persistent Session Behavior...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Create a persistent agent (like the live chat does)
    const sessionId = 'test-persistent-session';
    const agent = new ClarifyingRAGAgent(sessionId);
    
    // Simulate some previous interactions that might set context
    console.log('\n📝 Simulating previous interaction...');
    await agent.processRequest('What is the credit balance for John Smith?', 'gemini-2.5-flash-lite');
    
    console.log('\n📝 Agent context after first query:');
    console.log('confirmedCustomer:', agent.context.confirmedCustomer);
    console.log('agentState:', agent.agentState);
    
    // Now test the failing query
    console.log('\n📝 Testing: "What is the credit balance for CUST001?"');
    
    // Add debugging
    const originalSelectRetrievalTool = agent.selectRetrievalTool;
    agent.selectRetrievalTool = function(extractedInfo) {
      console.log('🔍 selectRetrievalTool called with:', extractedInfo);
      console.log('🔍 Context confirmedCustomer:', this.context.confirmedCustomer);
      const result = originalSelectRetrievalTool.call(this, extractedInfo);
      console.log('🔍 selectRetrievalTool result:', result);
      return result;
    };
    
    const result = await agent.processRequest('What is the credit balance for CUST001?', 'gemini-2.5-flash-lite');
    
    console.log('\n🤖 Final Result:');
    console.log('Type:', result.type);
    console.log('State:', result.agentState);
    console.log('Message preview:', result.message.substring(0, 100) + '...');
    
    // Test with a fresh agent for comparison
    console.log('\n📝 Testing with fresh agent for comparison...');
    const freshAgent = new ClarifyingRAGAgent('fresh-session');
    const freshResult = await freshAgent.processRequest('What is the credit balance for CUST001?', 'gemini-2.5-flash-lite');
    
    console.log('Fresh agent result type:', freshResult.type);
    console.log('Fresh agent message preview:', freshResult.message.substring(0, 100) + '...');
    
    console.log('\n🎉 Persistent session test completed!');
    
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
testPersistentSession();
