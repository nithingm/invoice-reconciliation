require('dotenv').config({ path: '../.env' });
const { ClarifyingRAGAgent } = require('../server/services/agentService');
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');

/**
 * Test all the fixes applied
 */
async function testAllFixes() {
  console.log('🧪 Testing All Fixes...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    const testCases = [
      {
        name: 'Unknown Customer Issue',
        query: 'Apply $100 credit from CUST001 to invoice INV001',
        expectedCustomer: 'John Smith',
        expectedBehavior: 'Should show John Smith, not Unknown Customer'
      },
      {
        name: 'Paid Invoice Validation',
        query: 'Apply $100 credit from John Smith to invoice INV005',
        expectedCustomer: 'John Smith',
        expectedBehavior: 'Should immediately reject paid invoice INV005'
      },
      {
        name: 'Non-existent Invoice',
        query: 'Apply credit to invoice INV999 for CUST001',
        expectedCustomer: 'John Smith',
        expectedBehavior: 'Should reject non-existent invoice INV999'
      },
      {
        name: 'No Amount Hallucination',
        query: 'Apply credit to invoice INV008 for CUST001',
        expectedCustomer: 'John Smith',
        expectedBehavior: 'Should not hallucinate amount, should ask for amount or use default'
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📝 Testing: ${testCase.name}`);
      console.log(`Query: "${testCase.query}"`);
      console.log(`Expected: ${testCase.expectedBehavior}`);
      
      // Create fresh agent for each test
      const agent = new ClarifyingRAGAgent(`test-${testCase.name.replace(/\s+/g, '-').toLowerCase()}`);
      
      const result = await agent.processRequest(testCase.query, 'ollama/llama3.2:3b');
      
      console.log('🤖 Result Type:', result.type);
      console.log('🤖 Result State:', result.agentState);
      
      // Check customer resolution
      if (result.message.includes('John Smith')) {
        console.log('✅ Customer: John Smith (correct)');
      } else if (result.message.includes('Unknown Customer')) {
        console.log('❌ Customer: Unknown Customer (WRONG)');
      } else if (result.message.includes('Mike Wilson')) {
        console.log('❌ Customer: Mike Wilson (WRONG - hallucination)');
      } else {
        console.log('❓ Customer: Not clearly identified');
      }
      
      // Check for amount hallucination
      const amountMatches = result.message.match(/\$(\d+)/g);
      if (amountMatches) {
        console.log('💰 Amounts found:', amountMatches);
        if (testCase.query.includes('Apply credit to invoice') && !testCase.query.includes('$')) {
          console.log('⚠️  Amount extracted when none specified - possible hallucination');
        }
      }
      
      console.log('📄 Message Preview:', result.message.substring(0, 150) + '...');
    }
    
    console.log('\n🎉 All fixes test completed!');
    
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
testAllFixes();
