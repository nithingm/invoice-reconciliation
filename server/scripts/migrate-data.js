/**
 * Data Migration Script
 * =====================
 * 
 * Migrates existing mock data to MongoDB
 * Run this script to populate MongoDB with initial data
 */

const { connectToMongoDB, disconnectFromMongoDB } = require('../config/mongodb');
const Customer = require('../models/Customer');
const Credit = require('../models/Credit');
const Invoice = require('../models/Invoice');

// Import existing mock data
const customersData = require('../data/customers');
const creditsData = require('../data/credits');
const invoicesData = require('../data/invoices');

/**
 * Clear existing data from MongoDB collections
 */
async function clearCollections() {
  console.log('🧹 Clearing existing collections...');
  
  await Customer.deleteMany({});
  await Credit.deleteMany({});
  await Invoice.deleteMany({});
  
  console.log('✅ Collections cleared');
}

/**
 * Migrate customers data
 */
async function migrateCustomers() {
  console.log('👥 Migrating customers...');
  
  for (const customerData of customersData) {
    try {
      // Convert joinDate string to Date object
      const customer = new Customer({
        ...customerData,
        joinDate: new Date(customerData.joinDate)
      });
      
      await customer.save();
      console.log(`✅ Migrated customer: ${customer.name} (${customer.id})`);
    } catch (error) {
      console.error(`❌ Failed to migrate customer ${customerData.id}:`, error.message);
    }
  }
  
  console.log(`✅ Migrated ${customersData.length} customers`);
}

/**
 * Migrate credits data
 */
async function migrateCredits() {
  console.log('💳 Migrating credits...');
  
  for (const creditData of creditsData) {
    try {
      // Convert date strings to Date objects
      const credit = new Credit({
        ...creditData,
        earnedDate: new Date(creditData.earnedDate),
        expiryDate: new Date(creditData.expiryDate),
        usageHistory: creditData.usageHistory.map(usage => ({
          ...usage,
          date: new Date(usage.date)
        }))
      });
      
      await credit.save();
      console.log(`✅ Migrated credit: ${credit.id} for ${credit.customerName}`);
    } catch (error) {
      console.error(`❌ Failed to migrate credit ${creditData.id}:`, error.message);
    }
  }
  
  console.log(`✅ Migrated ${creditsData.length} credits`);
}

/**
 * Migrate invoices data
 */
async function migrateInvoices() {
  console.log('🧾 Migrating invoices...');
  
  for (const invoiceData of invoicesData) {
    try {
      // Convert date strings to Date objects
      const invoice = new Invoice({
        ...invoiceData,
        date: new Date(invoiceData.date),
        dueDate: new Date(invoiceData.dueDate),
        paymentDate: invoiceData.paymentDate ? new Date(invoiceData.paymentDate) : null
      });
      
      await invoice.save();
      console.log(`✅ Migrated invoice: ${invoice.id} for ${invoice.customerName}`);
    } catch (error) {
      console.error(`❌ Failed to migrate invoice ${invoiceData.id}:`, error.message);
    }
  }
  
  console.log(`✅ Migrated ${invoicesData.length} invoices`);
}

/**
 * Verify data integrity after migration
 */
async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  const customerCount = await Customer.countDocuments();
  const creditCount = await Credit.countDocuments();
  const invoiceCount = await Invoice.countDocuments();
  
  console.log(`📊 Migration Summary:`);
  console.log(`   Customers: ${customerCount}`);
  console.log(`   Credits: ${creditCount}`);
  console.log(`   Invoices: ${invoiceCount}`);
  
  // Test a few relationships
  const sampleCustomer = await Customer.findOne({ id: 'CUST001' }).populate('credits').populate('invoices');
  if (sampleCustomer) {
    console.log(`🔗 Sample customer ${sampleCustomer.name} has ${sampleCustomer.credits?.length || 0} credits and ${sampleCustomer.invoices?.length || 0} invoices`);
  }
  
  console.log('✅ Migration verification complete');
}

/**
 * Main migration function
 */
async function runMigration() {
  try {
    console.log('🚀 Starting data migration...');
    console.log('================================');
    
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Clear existing data
    await clearCollections();
    
    // Migrate data in order (customers first, then credits and invoices)
    await migrateCustomers();
    await migrateCredits();
    await migrateInvoices();
    
    // Verify migration
    await verifyMigration();
    
    console.log('================================');
    console.log('🎉 Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    await disconnectFromMongoDB();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  runMigration,
  clearCollections,
  migrateCustomers,
  migrateCredits,
  migrateInvoices,
  verifyMigration
};
