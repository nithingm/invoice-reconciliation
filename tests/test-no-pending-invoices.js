require('dotenv').config({ path: '../.env' });
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');

/**
 * Test "No Pending Invoices" formatting specifically
 */
async function testNoPendingInvoices() {
  console.log('🧪 Testing No Pending Invoices Formatting...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Test with Sarah Johnson who has no pending invoices
    const agent = new ClarifyingRAGAgent('test-no-pending-invoices');
    
    console.log('\n📝 Testing: Apply credit to Sarah Johnson (who has no pending invoices)');
    console.log('Query: "Apply $100 credit from Sarah Johnson to any invoice"');
    
    const result = await agent.processRequest('Apply $100 credit from Sarah Johnson to any invoice', 'gemini-2.5-flash-lite');
    
    console.log('\n🤖 Result Type:', result.type);
    console.log('🤖 Result State:', result.agentState);
    
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
    if (result.message.includes('"availableCredits"') || result.message.includes('"pendingInvoices"')) {
      console.log('❌ Raw JSON: Found raw JSON in message (bad formatting)');
    } else {
      console.log('✅ Raw JSON: No raw JSON found (good formatting)');
    }
    
    // Check for proper bold formatting
    if (result.message.includes('<strong>') && result.message.includes('</strong>')) {
      console.log('✅ Bold Formatting: Found HTML bold tags (properly formatted)');
    } else if (result.message.includes('**')) {
      console.log('⚠️ Bold Formatting: Found markdown ** (needs HTML conversion)');
    } else {
      console.log('❌ Bold Formatting: No bold formatting found');
    }
    
    // Check for collapsible details section
    if (result.message.includes('<details>') && result.message.includes('<summary>')) {
      console.log('✅ Collapsible Section: Found HTML details/summary tags');
    } else {
      console.log('❌ Collapsible Section: Missing HTML details/summary tags');
    }
    
    console.log('\n🎉 No Pending Invoices test completed!');
    
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
testNoPendingInvoices();
