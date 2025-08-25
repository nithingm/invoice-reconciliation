require('dotenv').config({ path: '../.env' });
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');

/**
 * Test Mike Wilson contamination scenario
 */
async function testMikeWilsonContamination() {
  console.log('🧪 Testing Mike Wilson Contamination Scenario...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Simulate a session that might have Mike Wilson data
    const agent = new ClarifyingRAGAgent('contamination-test');
    
    // First, let's query Mike Wilson to populate the context
    console.log('\n📝 Step 1: Query Mike Wilson to populate context');
    const mikeResult = await agent.processRequest('What is the credit balance for Mike Wilson?', 'gemini-2.5-flash-lite');
    console.log('Mike Wilson query result:', mikeResult.message.includes('Mike Wilson') ? 'Mike Wilson ✅' : 'Other');
    
    // Check agent context after Mike Wilson query
    console.log('\n🔍 Agent context after Mike Wilson query:');
    console.log('confirmedData:', agent.context.confirmedData ? 
                 (Array.isArray(agent.context.confirmedData) ? agent.context.confirmedData[0]?.name : agent.context.confirmedData.name) : 'null');
    
    // Now try the CUST001 queries that were failing
    console.log('\n📝 Step 2: "Apply $5 credit from CUST001 to invoice INV005"');
    const result1 = await agent.processRequest('Apply $5 credit from CUST001 to invoice INV005', 'gemini-2.5-flash-lite');
    console.log('Result 1 Customer:', result1.message.includes('John Smith') ? 'John Smith ✅' : 
                                      result1.message.includes('Mike Wilson') ? 'Mike Wilson ❌' :
                                      result1.message.includes('Unknown Customer') ? 'Unknown Customer ❌' : 'Other');
    
    console.log('\n📝 Step 3: "Apply $5 credit from CUST001 to invoice INV001"');
    const result2 = await agent.processRequest('Apply $5 credit from CUST001 to invoice INV001', 'gemini-2.5-flash-lite');
    console.log('Result 2 Customer:', result2.message.includes('John Smith') ? 'John Smith ✅' : 
                                      result2.message.includes('Mike Wilson') ? 'Mike Wilson ❌' :
                                      result2.message.includes('Unknown Customer') ? 'Unknown Customer ❌' : 'Other');
    
    console.log('\n📝 Step 4: "Apply $5 credit from CUST001 to invoice INV008"');
    const result3 = await agent.processRequest('Apply $5 credit from CUST001 to invoice INV008', 'gemini-2.5-flash-lite');
    console.log('Result 3 Customer:', result3.message.includes('John Smith') ? 'John Smith ✅' : 
                                      result3.message.includes('Mike Wilson') ? 'Mike Wilson ❌' :
                                      result3.message.includes('Unknown Customer') ? 'Unknown Customer ❌' : 'Other');
    
    // Check final agent context
    console.log('\n🔍 Final Agent Context:');
    console.log('confirmedData:', agent.context.confirmedData ? 
                 (Array.isArray(agent.context.confirmedData) ? agent.context.confirmedData[0]?.name : agent.context.confirmedData.name) : 'null');
    
    console.log('\n🎉 Mike Wilson contamination test completed!');
    
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
testMikeWilsonContamination();
