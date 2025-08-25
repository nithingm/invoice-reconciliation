require('dotenv').config({ path: '../.env' });
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');

/**
 * Test session isolation - ensure each query gets the right customer
 */
async function testSessionIsolation() {
  console.log('🧪 Testing Session Isolation...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Create a persistent agent (like the live chat)
    const agent = new ClarifyingRAGAgent('session-isolation-test');
    
    // First query - Mike Wilson (CUST003)
    console.log('\n📝 Query 1: "What is the credit balance for Mike Wilson?"');
    const result1 = await agent.processRequest('What is the credit balance for Mike Wilson?', 'gemini-2.5-flash-lite');
    console.log('Result 1 customer:', result1.message.includes('Mike Wilson') ? 'Mike Wilson ✅' : 'Wrong customer ❌');
    
    // Second query - John Smith (CUST001) - this should NOT use Mike Wilson's data
    console.log('\n📝 Query 2: "Apply $5 credits from CUST001 to invoice INV001"');
    const result2 = await agent.processRequest('Apply $5 credits from CUST001 to invoice INV001', 'gemini-2.5-flash-lite');
    
    if (result2.message.includes('John Smith')) {
      console.log('✅ Result 2 customer: John Smith (correct)');
    } else if (result2.message.includes('Mike Wilson')) {
      console.log('❌ Result 2 customer: Mike Wilson (WRONG - session contamination)');
    } else {
      console.log('❓ Result 2 customer: Unknown');
    }
    
    // Third query - Lisa Chen (CUST004) - should get fresh lookup
    console.log('\n📝 Query 3: "What is the credit balance for Lisa Chen?"');
    const result3 = await agent.processRequest('What is the credit balance for Lisa Chen?', 'gemini-2.5-flash-lite');
    console.log('Result 3 customer:', result3.message.includes('Lisa Chen') ? 'Lisa Chen ✅' : 'Wrong customer ❌');
    
    console.log('\n🎉 Session isolation test completed!');
    
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
testSessionIsolation();
