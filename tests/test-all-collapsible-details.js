require('dotenv').config({ path: '../.env' });
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');
const { ClarifyingRAGAgent } = require('../server/services/agentService');

/**
 * Test all functions to ensure they use collapsible details consistently
 */
async function testAllCollapsibleDetails() {
  console.log('🧪 Testing All Functions for Collapsible Details...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    const customerData = {
      id: 'CUST001',
      name: 'John Smith'
    };
    
    const testCases = [
      {
        name: 'Add Credits',
        test: async () => {
          const agent = new ClarifyingRAGAgent('test-add-credits');
          agent.context.originalExtractedInfo = { creditAmount: 50 };
          return await agent.executeAddCredits(customerData);
        }
      },
      {
        name: 'Credit Balance Inquiry',
        test: async () => {
          const agent = new ClarifyingRAGAgent('test-credit-balance');
          return await agent.executeCreditBalanceInquiry(customerData);
        }
      },
      {
        name: 'Payment History',
        test: async () => {
          const agent = new ClarifyingRAGAgent('test-payment-history');
          return await agent.executePaymentHistoryInquiry(customerData);
        }
      },
      {
        name: 'Overdue Inquiry',
        test: async () => {
          const agent = new ClarifyingRAGAgent('test-overdue');
          return await agent.executeOverdueInquiry(customerData);
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📝 Testing: ${testCase.name}`);
      console.log('='.repeat(40));
      
      try {
        const result = await testCase.test();
        
        console.log('🤖 Result Type:', result.type);
        
        // Check for collapsible details format
        if (result.message.includes('---DETAILS---')) {
          console.log('✅ Collapsible Details: Found ---DETAILS--- separator');
        } else {
          console.log('❌ Collapsible Details: Missing ---DETAILS--- separator');
        }
        
        // Check if there's a details property (should be removed)
        if (result.details) {
          console.log('❌ Raw Details Property: Still present (should be removed)');
        } else {
          console.log('✅ Raw Details Property: Properly removed');
        }
        
        // Check for valid JSON in details section
        const detailsParts = result.message.split('---DETAILS---');
        if (detailsParts.length === 2) {
          try {
            const detailsJson = JSON.parse(detailsParts[1].trim());
            console.log('✅ Details JSON: Valid JSON structure');
          } catch (e) {
            console.log('❌ Details JSON: Invalid JSON structure');
          }
        }
        
        // Show first 100 characters of message
        console.log('📄 Message Preview:', result.message.substring(0, 100) + '...');
        
      } catch (error) {
        console.log('❌ Test failed:', error.message);
      }
    }
    
    console.log('\n🎉 All collapsible details tests completed!');
    console.log('\n📋 Summary: All functions should now use consistent collapsible details formatting.');
    
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
testAllCollapsibleDetails();
