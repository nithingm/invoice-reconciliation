require('dotenv').config({ path: '../.env' });
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');
const { ClarifyingRAGAgent } = require('../server/services/agentService');

/**
 * Test add credits formatting to ensure it uses collapsible details
 */
async function testAddCreditsFormat() {
  console.log('🧪 Testing Add Credits Formatting...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Test add credits for John Smith
    console.log('\n📝 Testing: executeAddCredits for John Smith');
    
    // Create agent and set up context
    const agent = new ClarifyingRAGAgent('test-add-credits-format');
    agent.context.originalExtractedInfo = {
      creditAmount: 100
    };
    
    const customerData = {
      id: 'CUST001',
      name: 'John Smith'
    };
    
    const result = await agent.executeAddCredits(customerData);
    
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
    
    // Check if there's a details property (should be removed)
    if (result.details) {
      console.log('❌ Raw Details Property: Still present (should be removed)');
      console.log('Details:', JSON.stringify(result.details, null, 2));
    } else {
      console.log('✅ Raw Details Property: Properly removed');
    }
    
    // Check for proper bold formatting
    if (result.message.includes('<strong>') && result.message.includes('</strong>')) {
      console.log('✅ Bold Formatting: Found HTML bold tags (properly formatted)');
    } else if (result.message.includes('**')) {
      console.log('⚠️ Bold Formatting: Found markdown ** (needs HTML conversion)');
    } else {
      console.log('❌ Bold Formatting: No bold formatting found');
    }
    
    // Check for valid JSON in details section
    const detailsParts = result.message.split('---DETAILS---');
    if (detailsParts.length === 2) {
      try {
        const detailsJson = JSON.parse(detailsParts[1].trim());
        console.log('✅ Details JSON: Valid JSON structure');
        console.log('Details contains:', Object.keys(detailsJson));
      } catch (e) {
        console.log('❌ Details JSON: Invalid JSON structure');
      }
    }
    
    console.log('\n🎉 Add Credits Format test completed!');
    
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
testAddCreditsFormat();
