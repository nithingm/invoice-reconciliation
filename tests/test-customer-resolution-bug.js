require('dotenv').config({ path: '../.env' });
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');

/**
 * Debug the customer resolution bug
 */
async function debugCustomerResolution() {
  console.log('🧪 Debugging Customer Resolution Bug...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Test the exact query that's failing
    console.log('\n📝 Testing: "Apply $5 credits from CUST001 to invoice INV001"');
    
    const agent = new ClarifyingRAGAgent('debug-customer-resolution');
    
    // Add debugging to track customer resolution
    const originalExecuteRetrievalTool = agent.executeRetrievalTool;
    agent.executeRetrievalTool = async function(toolSelection) {
      console.log('🔍 executeRetrievalTool called with:', toolSelection);
      const result = await originalExecuteRetrievalTool.call(this, toolSelection);
      console.log('🔍 executeRetrievalTool result:', result);
      return result;
    };
    
    const result = await agent.processRequest('Apply $5 credits from CUST001 to invoice INV001', 'gemini-2.5-flash-lite');
    
    console.log('\n🤖 Final Result:');
    console.log('Type:', result.type);
    console.log('State:', result.agentState);
    console.log('Message preview:', result.message.substring(0, 200) + '...');
    
    // Check if the message contains the wrong customer
    if (result.message.includes('Mike Wilson')) {
      console.log('❌ BUG CONFIRMED: Message contains Mike Wilson instead of John Smith');
    } else if (result.message.includes('John Smith')) {
      console.log('✅ Customer resolution working correctly');
    } else {
      console.log('❓ Customer name not found in message');
    }
    
    console.log('\n🎉 Customer resolution debug completed!');
    
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
debugCustomerResolution();
