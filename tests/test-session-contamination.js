require('dotenv').config({ path: '../.env' });
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');

/**
 * Test session contamination issues
 */
async function testSessionContamination() {
  console.log('🧪 Testing Session Contamination Issues...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Simulate the exact sequence from the live chat
    const agent = new ClarifyingRAGAgent('live-chat-simulation');
    
    console.log('\n📝 Case 1: "Apply $5 credit from CUST001 to invoice INV005"');
    const result1 = await agent.processRequest('Apply $5 credit from CUST001 to invoice INV005', 'gemini-2.5-flash-lite');
    console.log('Result 1 Type:', result1.type);
    console.log('Result 1 Customer:', result1.message.includes('John Smith') ? 'John Smith ✅' : 
                                      result1.message.includes('Mike Wilson') ? 'Mike Wilson ❌' :
                                      result1.message.includes('Unknown Customer') ? 'Unknown Customer ❌' : 'Other');
    
    // Simulate user saying "yes"
    if (result1.type === 'confirmation_needed') {
      console.log('\n📝 User responds: "yes"');
      const confirmResult = await agent.processRequest('yes', 'gemini-2.5-flash-lite');
      console.log('Confirmation Result Type:', confirmResult.type);
      console.log('Confirmation Message Preview:', confirmResult.message.substring(0, 100) + '...');
    }
    
    console.log('\n📝 Case 2: "Apply $5 credit from CUST001 to invoice INV001"');
    const result2 = await agent.processRequest('Apply $5 credit from CUST001 to invoice INV001', 'gemini-2.5-flash-lite');
    console.log('Result 2 Type:', result2.type);
    console.log('Result 2 Customer:', result2.message.includes('John Smith') ? 'John Smith ✅' : 
                                      result2.message.includes('Mike Wilson') ? 'Mike Wilson ❌' :
                                      result2.message.includes('Unknown Customer') ? 'Unknown Customer ❌' : 'Other');
    
    console.log('\n📝 Case 3: "Apply $5 credit from CUST001 to invoice INV008"');
    const result3 = await agent.processRequest('Apply $5 credit from CUST001 to invoice INV008', 'gemini-2.5-flash-lite');
    console.log('Result 3 Type:', result3.type);
    console.log('Result 3 Customer:', result3.message.includes('John Smith') ? 'John Smith ✅' : 
                                      result3.message.includes('Mike Wilson') ? 'Mike Wilson ❌' :
                                      result3.message.includes('Unknown Customer') ? 'Unknown Customer ❌' : 'Other');
    
    // Check agent context after each step
    console.log('\n🔍 Final Agent Context:');
    console.log('confirmedData:', agent.context.confirmedData ? 
                 (Array.isArray(agent.context.confirmedData) ? agent.context.confirmedData[0]?.name : agent.context.confirmedData.name) : 'null');
    console.log('agentState:', agent.agentState);
    
    console.log('\n🎉 Session contamination test completed!');
    
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
testSessionContamination();
