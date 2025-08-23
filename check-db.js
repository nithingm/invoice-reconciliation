const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/transmission-portal';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check customers
    const Customer = mongoose.model('Customer', new mongoose.Schema({}, { strict: false }));
    const customerCount = await Customer.countDocuments();
    console.log(`\n👥 Customers: ${customerCount} records`);
    if (customerCount > 0) {
      const customers = await Customer.find().limit(3);
      customers.forEach(customer => {
        console.log(`  - ${customer.id}: ${customer.name}`);
      });
    }
    
    // Check credits
    const Credit = mongoose.model('Credit', new mongoose.Schema({}, { strict: false }));
    const creditCount = await Credit.countDocuments();
    console.log(`\n💳 Credits: ${creditCount} records`);
    if (creditCount > 0) {
      const credits = await Credit.find().limit(3);
      credits.forEach(credit => {
        console.log(`  - ${credit.id}: $${credit.amount} (${credit.status})`);
      });
    }
    
    // Check invoices
    const Invoice = mongoose.model('Invoice', new mongoose.Schema({}, { strict: false }));
    const invoiceCount = await Invoice.countDocuments();
    console.log(`\n📄 Invoices: ${invoiceCount} records`);
    if (invoiceCount > 0) {
      const invoices = await Invoice.find().limit(3);
      invoices.forEach(invoice => {
        console.log(`  - ${invoice._id}: ${invoice.originalAmount} (${invoice.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();
