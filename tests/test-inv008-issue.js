require('dotenv').config({ path: '../.env' });
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');

/**
 * Test INV008 specific issue
 */
async function testINV008Issue() {
  console.log('🧪 Testing INV008 Specific Issue...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Check invoice INV008 details first
    console.log('\n📝 Checking INV008 details in database...');
    const Invoice = require('../server/models/Invoice');
    const inv008 = await Invoice.findOne({ id: 'INV008' });
    console.log('INV008 details:', {
      id: inv008?.id,
      customerId: inv008?.customerId,
      status: inv008?.status,
      currentAmount: inv008?.currentAmount
    });
    
    // Test the exact sequence that's failing
    const agent = new ClarifyingRAGAgent('inv008-test');
    
    // First two queries (working correctly)
    console.log('\n📝 Case 1: "Apply $5 credits from CUST001 to invoice INV001"');
    const result1 = await agent.processRequest('Apply $5 credits from CUST001 to invoice INV001', 'gemini-2.5-flash-lite');
    console.log('Result 1 Customer:', result1.message.includes('John Smith') ? 'John Smith ✅' : 
                                      result1.message.includes('Mike Wilson') ? 'Mike Wilson ❌' : 'Other');
    
    console.log('\n📝 Case 2: "Apply $5 credits from CUST001 to invoice INV005"');
    const result2 = await agent.processRequest('Apply $5 credits from CUST001 to invoice INV005', 'gemini-2.5-flash-lite');
    console.log('Result 2 Customer:', result2.message.includes('John Smith') ? 'John Smith ✅' : 
                                      result2.message.includes('Mike Wilson') ? 'Mike Wilson ❌' : 'Other');
    
    // The problematic third query
    console.log('\n📝 Case 3: "Apply $5 credits from CUST001 to invoice INV008"');
    const result3 = await agent.processRequest('Apply $5 credits from CUST001 to invoice INV008', 'gemini-2.5-flash-lite');
    console.log('Result 3 Type:', result3.type);
    console.log('Result 3 Customer:', result3.message.includes('John Smith') ? 'John Smith ✅' : 
                                      result3.message.includes('Mike Wilson') ? 'Mike Wilson ❌' : 'Other');
    
    // Check agent context
    console.log('\n🔍 Agent Context After All Queries:');
    console.log('confirmedData:', agent.context.confirmedData ? 
                 (Array.isArray(agent.context.confirmedData) ? agent.context.confirmedData[0]?.name : agent.context.confirmedData.name) : 'null');
    
    // Test INV008 with fresh agent
    console.log('\n📝 Testing INV008 with fresh agent...');
    const freshAgent = new ClarifyingRAGAgent('fresh-inv008-test');
    const freshResult = await freshAgent.processRequest('Apply $5 credits from CUST001 to invoice INV008', 'gemini-2.5-flash-lite');
    console.log('Fresh Agent Result Customer:', freshResult.message.includes('John Smith') ? 'John Smith ✅' : 
                                                freshResult.message.includes('Mike Wilson') ? 'Mike Wilson ❌' : 'Other');
    
    console.log('\n🎉 INV008 test completed!');
    
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
testINV008Issue();
