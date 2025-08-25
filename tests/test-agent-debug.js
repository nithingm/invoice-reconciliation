require('dotenv').config({ path: '../.env' });
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');

/**
 * Debug the agent flow for customer ID lookup
 */
async function debugAgentFlow() {
  console.log('🧪 Debugging Agent Flow...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Create a fresh agent
    const agent = new ClarifyingRAGAgent('debug-session');
    
    // Test the exact query that's failing
    console.log('\n📝 Testing: "What is the credit balance for CUST001?"');
    
    // Add some debugging to the agent
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
    
    console.log('\n🎉 Debug test completed!');
    
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
debugAgentFlow();
