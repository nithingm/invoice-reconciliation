require('dotenv').config({ path: '../.env' });
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');

/**
 * Test paid invoice details formatting
 */
async function testPaidInvoiceDetails() {
  console.log('🧪 Testing Paid Invoice Details...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Test a paid invoice that should show details
    console.log('\n📝 Testing: "Apply $5 credit from CUST001 to invoice INV005"');
    
    const agent = new ClarifyingRAGAgent('test-paid-details');
    const result = await agent.processRequest('Apply $5 credit from CUST001 to invoice INV005', 'gemini-2.5-flash-lite');
    
    console.log('\n📄 Full Message:');
    console.log('================');
    console.log(result.message);
    console.log('================');
    
    // Check for formatting elements
    if (result.message.includes('**')) {
      console.log('✅ Bold markdown formatting present');
    } else {
      console.log('❌ No bold markdown formatting found');
    }
    
    if (result.message.includes('---DETAILS---')) {
      console.log('✅ Collapsible details separator present');
      
      // Check what comes after the separator
      const parts = result.message.split('---DETAILS---');
      if (parts.length > 1) {
        console.log('\n📋 Details Content:');
        console.log('-------------------');
        console.log(parts[1].trim());
        console.log('-------------------');
        
        // Check if it's valid JSON
        try {
          const parsed = JSON.parse(parts[1].trim());
          console.log('✅ Details content is valid JSON');
          console.log('📊 Details keys:', Object.keys(parsed));
        } catch (e) {
          console.log('❌ Details content is not valid JSON:', e.message);
        }
      }
    } else {
      console.log('❌ No collapsible details separator found');
    }
    
    console.log('\n🎉 Paid invoice details test completed!');
    
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
testPaidInvoiceDetails();
