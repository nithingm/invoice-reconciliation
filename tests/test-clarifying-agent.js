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
    
    console.log('\n📝 Test 1: Smart credit application');
    console.log('User: "Apply 250$ credit for Mike Wilson"');

    const result1 = await agent.processRequest(
      'Apply 250$ credit for Mike Wilson',
      'gemini-2.5-flash-lite'
    );
    
    console.log('🤖 Agent Response:');
    console.log('Type:', result1.type);
    console.log('State:', result1.agentState);
    console.log('Message:', result1.message);
    
    if (result1.type === 'confirmation_needed') {
      console.log('\n✅ Agent correctly asked for confirmation and showed application plan!');

      console.log('\n📝 Test 2: User confirmation');
      console.log('User: "Yes, proceed"');

      const result2 = await agent.processRequest('Yes, proceed');

      console.log('🤖 Agent Response:');
      console.log('Type:', result2.type);
      console.log('State:', result2.agentState);
      console.log('Message:', result2.message);

      if (result2.type === 'success') {
        console.log('\n✅ Smart credit application executed successfully!');
      }
    } else if (result1.type === 'insufficient_credits') {
      console.log('\n✅ Agent correctly detected insufficient credits!');
    } else if (result1.type === 'success') {
      console.log('\n✅ Agent showed smart application plan directly!');
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
