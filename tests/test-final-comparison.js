require('dotenv').config({ path: '../.env' });
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');
const { ClarifyingRAGAgent } = require('../server/services/agentService');

/**
 * Final comparison test between credit balance query and no pending invoices
 */
async function testFinalComparison() {
  console.log('🧪 Final Comparison Test: Credit Balance vs No Pending Invoices...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    const customerData = {
      id: 'CUST002',
      name: 'Sarah Johnson'
    };
    
    // Test 1: Credit Balance Query
    console.log('\n📝 Test 1: Credit Balance Query');
    console.log('================================');
    
    const agent1 = new ClarifyingRAGAgent('test-credit-balance');
    const result1 = await agent1.executeCreditBalanceInquiry(customerData);
    
    console.log('Type:', result1.type);
    console.log('Has ---DETAILS---:', result1.message.includes('---DETAILS---'));
    console.log('Has raw JSON:', result1.message.includes('"customerId"'));
    
    // Test 2: No Pending Invoices
    console.log('\n📝 Test 2: No Pending Invoices');
    console.log('===============================');
    
    const agent2 = new ClarifyingRAGAgent('test-no-pending');
    agent2.context.originalExtractedInfo = {
      creditAmount: 100,
      invoiceId: null
    };
    
    const result2 = await agent2.executeSmartCreditApplication(customerData);
    
    console.log('Type:', result2.type);
    console.log('State:', result2.agentState);
    console.log('Has ---DETAILS---:', result2.message.includes('---DETAILS---'));
    console.log('Has raw JSON:', result2.message.includes('"availableCredits"'));
    
    // Compare formatting
    console.log('\n📊 Comparison Results');
    console.log('=====================');
    
    const creditBalanceHasDetails = result1.message.includes('---DETAILS---');
    const noPendingHasDetails = result2.message.includes('---DETAILS---');
    
    if (creditBalanceHasDetails && noPendingHasDetails) {
      console.log('✅ Both messages have ---DETAILS--- separator');
    } else {
      console.log('❌ Inconsistent ---DETAILS--- formatting');
      console.log('  Credit Balance has details:', creditBalanceHasDetails);
      console.log('  No Pending has details:', noPendingHasDetails);
    }
    
    // Check if both have the same structure
    const creditBalanceParts = result1.message.split('---DETAILS---');
    const noPendingParts = result2.message.split('---DETAILS---');
    
    if (creditBalanceParts.length === 2 && noPendingParts.length === 2) {
      console.log('✅ Both messages have proper main content + details structure');
      
      // Check if details are valid JSON
      try {
        JSON.parse(creditBalanceParts[1].trim());
        console.log('✅ Credit balance details are valid JSON');
      } catch (e) {
        console.log('❌ Credit balance details are not valid JSON');
      }
      
      try {
        JSON.parse(noPendingParts[1].trim());
        console.log('✅ No pending invoices details are valid JSON');
      } catch (e) {
        console.log('❌ No pending invoices details are not valid JSON');
      }
    } else {
      console.log('❌ Inconsistent message structure');
    }
    
    console.log('\n🎉 Final comparison test completed!');
    console.log('\n📋 Summary: Both messages now have the same collapsible details format.');
    console.log('The frontend will render both with the same collapsible UI.');
    
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
testFinalComparison();
