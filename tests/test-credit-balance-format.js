require('dotenv').config({ path: '../.env' });
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');
const { ClarifyingRAGAgent } = require('../server/services/agentService');

/**
 * Test credit balance query formatting to compare with "No Pending Invoices"
 */
async function testCreditBalanceFormat() {
  console.log('🧪 Testing Credit Balance Query Formatting...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Test credit balance query for Sarah Johnson
    console.log('\n📝 Testing: executeCreditBalanceInquiry for Sarah Johnson');
    
    // Create agent and set up context
    const agent = new ClarifyingRAGAgent('test-credit-balance-format');
    
    const customerData = {
      id: 'CUST002',
      name: 'Sarah Johnson'
    };
    
    const result = await agent.executeCreditBalanceInquiry(customerData);
    
    console.log('\n🤖 Result Type:', result.type);
    
    console.log('\n📄 Full Message:');
    console.log('================');
    console.log(result.message);
    console.log('================');
    
    // Check for collapsible details format
    if (result.message.includes('---DETAILS---')) {
      console.log('✅ Collapsible Details: Found ---DETAILS--- separator');
    } else {
      console.log('❌ Collapsible Details: Missing ---DETAILS--- separator');
    }
    
    // Check for raw JSON (bad formatting)
    if (result.message.includes('"customerId"') || result.message.includes('"totalAmount"')) {
      console.log('⚠️ Raw JSON: Found raw JSON in message (this is expected for comparison)');
    } else {
      console.log('✅ Raw JSON: No raw JSON found');
    }
    
    console.log('\n🎉 Credit Balance Format test completed!');
    
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
testCreditBalanceFormat();
