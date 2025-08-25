require('dotenv').config({ path: '../.env' });
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');

/**
 * Test the formatting fixes
 */
async function testFormatting() {
  console.log('🧪 Testing Formatting Fixes...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Test credit balance query to see full formatting
    console.log('\n📝 Testing Credit Balance Query with Formatting');
    const agent1 = new ClarifyingRAGAgent('format-test-1');
    const result1 = await agent1.processRequest('What is the credit balance for CUST001?', 'gemini-2.5-flash-lite');
    
    console.log('🤖 Response Type:', result1.type);
    console.log('🤖 Response State:', result1.agentState);
    console.log('\n📄 Full Message:');
    console.log('================');
    console.log(result1.message);
    console.log('================');
    
    // Check for formatting elements
    if (result1.message.includes('**')) {
      console.log('✅ Bold markdown formatting present');
    } else {
      console.log('❌ No bold markdown formatting found');
    }
    
    if (result1.message.includes('---DETAILS---')) {
      console.log('✅ Collapsible details section present');
    } else {
      console.log('❌ No collapsible details section found');
    }
    
    console.log('\n🎉 Formatting test completed!');
    
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
testFormatting();
