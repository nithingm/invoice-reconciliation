require('dotenv').config({ path: '../.env' });
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');
const { findCustomerByName } = require('../server/services/tools/retrievalTools');

/**
 * Test customer lookup functionality
 */
async function testCustomerLookup() {
  console.log('🧪 Testing Customer Lookup...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Test 1: Search by customer ID
    console.log('\n📝 Test 1: Search by customer ID "CUST001"');
    try {
      const result1 = await findCustomerByName('CUST001');
      console.log('✅ Result:', result1);
      
      if (result1.length > 0) {
        console.log('✅ Customer found by ID');
      } else {
        console.log('❌ Customer NOT found by ID');
      }
    } catch (error) {
      console.error('❌ Error searching by ID:', error);
    }
    
    // Test 2: Search by customer name
    console.log('\n📝 Test 2: Search by customer name "John Smith"');
    try {
      const result2 = await findCustomerByName('John Smith');
      console.log('✅ Result:', result2);
      
      if (result2.length > 0) {
        console.log('✅ Customer found by name');
      } else {
        console.log('❌ Customer NOT found by name');
      }
    } catch (error) {
      console.error('❌ Error searching by name:', error);
    }
    
    // Test 3: Direct MongoDB query
    console.log('\n📝 Test 3: Direct MongoDB query');
    const Customer = require('../server/models/Customer');
    try {
      const directResult = await Customer.findOne({ id: 'CUST001' });
      console.log('✅ Direct MongoDB result:', directResult ? `Found: ${directResult.name}` : 'Not found');
    } catch (error) {
      console.error('❌ Direct MongoDB error:', error);
    }
    
    console.log('\n🎉 Customer lookup test completed!');
    
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
testCustomerLookup();
