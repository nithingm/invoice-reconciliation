require('dotenv').config({ path: '../.env' });
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');

/**
 * Test invoice status handling bug
 */
async function testInvoiceStatusBug() {
  console.log('🧪 Testing Invoice Status Bug...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Test all three scenarios
    const testCases = [
      {
        query: 'Apply $5 credit from CUST001 to invoice INV001',
        invoice: 'INV001',
        expectedStatus: 'paid',
        expectedBehavior: 'error message'
      },
      {
        query: 'Apply $5 credit from CUST001 to invoice INV005', 
        invoice: 'INV005',
        expectedStatus: 'paid',
        expectedBehavior: 'error message'
      },
      {
        query: 'Apply $5 credit from CUST001 to invoice INV008',
        invoice: 'INV008', 
        expectedStatus: 'pending',
        expectedBehavior: 'success/confirmation'
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📝 Testing: "${testCase.query}"`);
      console.log(`Expected: ${testCase.expectedBehavior} (invoice status: ${testCase.expectedStatus})`);
      
      // Create fresh agent for each test
      const agent = new ClarifyingRAGAgent(`test-${testCase.invoice}`);
      
      const result = await agent.processRequest(testCase.query, 'gemini-2.5-flash-lite');
      
      console.log('🤖 Result Type:', result.type);
      console.log('🤖 Result State:', result.agentState);
      console.log('🤖 Message Preview:', result.message.substring(0, 150) + '...');
      
      // Check if behavior matches expectation
      if (testCase.expectedStatus === 'paid') {
        if (result.type === 'error' && result.message.includes('already paid')) {
          console.log('✅ Correct: Shows "already paid" error');
        } else if (result.type === 'confirmation_needed') {
          console.log('❌ BUG: Shows confirmation instead of error');
        } else {
          console.log('❓ Unexpected behavior:', result.type);
        }
      } else {
        if (result.type === 'confirmation_needed' || result.type === 'success') {
          console.log('✅ Correct: Shows confirmation/success for pending invoice');
        } else {
          console.log('❓ Unexpected behavior for pending invoice:', result.type);
        }
      }
    }
    
    console.log('\n🎉 Invoice status test completed!');
    
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
testInvoiceStatusBug();
