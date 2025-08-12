# 🗄️ **New Relational Mock Database Structure**

## 🎯 **Overview**
Successfully created a realistic, relational mock database with separate files for each entity, connected through IDs like a real database system.

## 📁 **Database File Structure**

### **📋 server/data/customers.js**
**Contains**: 5 detailed customer records
**Fields**:
- `id` - Unique customer ID (CUST001, CUST002, etc.)
- `name` - Full customer name
- `email` - Customer email address
- `phone` - Phone number with formatting
- `joinDate` - Customer registration date
- `address` - Complete address object (street, city, state, zip, country)
- `company` - Business name
- `businessType` - Type of business (Auto Repair, Fleet Services, etc.)
- `creditIds` - Array of credit IDs belonging to this customer
- `invoiceIds` - Array of invoice IDs for this customer
- `status` - Account status (active, inactive)
- `creditLimit` - Maximum credit limit
- `paymentTerms` - Payment terms (Net 30, Net 15, etc.)
- `preferredContact` - Preferred contact method
- `notes` - Customer notes and history

### **💳 server/data/credits.js**
**Contains**: 12 detailed credit records
**Fields**:
- `id` - Unique credit ID (CREDIT001, CREDIT002, etc.)
- `customerId` - Links to customer (CUST001, CUST002, etc.)
- `customerName` - Customer name for easy reference
- `amount` - Current available credit amount
- `originalAmount` - Original credit amount when issued
- `status` - Credit status (active, used, partially_used)
- `earnedDate` - Date credit was earned
- `expiryDate` - Credit expiration date
- `sourceInvoiceId` - Invoice that generated this credit (if applicable)
- `sourceType` - How credit was earned (purchase_reward, damage_compensation, etc.)
- `description` - Detailed description of credit
- `category` - Credit category (loyalty_reward, damage_credit, etc.)
- `usageHistory` - Array of usage records with dates and amounts
- `notes` - Additional notes about the credit

### **🧾 server/data/invoices.js**
**Contains**: 8+ detailed invoice records
**Fields**:
- `id` - Unique invoice ID (INV001, INV002, etc.)
- `customerId` - Links to customer (CUST001, CUST002, etc.)
- `customerName` - Customer name for easy reference
- `date` - Invoice date
- `dueDate` - Payment due date
- `originalAmount` - Original invoice total
- `currentAmount` - Current amount after credits applied
- `creditsApplied` - Total credits applied to this invoice
- `appliedCreditIds` - Array of credit IDs applied to this invoice
- `status` - Invoice status (pending, paid)
- `paymentStatus` - Payment status (pending, paid)
- `paymentDate` - Date payment was received
- `description` - Invoice description
- `items` - Array of line items with detailed product information
- `taxes` - Tax information (amount, rate, exempt status)
- `shipping` - Shipping details (cost, method, tracking)
- `notes` - Invoice notes
- `earnedCreditIds` - Credits earned from this invoice
- `relatedCreditMemos` - Related credit memo IDs

### **🔗 server/data/database.js**
**Contains**: Main database module with helper functions
**Features**:
- Imports all separate data files
- Provides relational query functions
- Handles data integrity and relationships
- Offers convenient helper methods

## 🔗 **Relational Connections**

### **Customer → Credits**
```javascript
// Customer has creditIds array
customer.creditIds = ["CREDIT001", "CREDIT002", "CREDIT007"]

// Credits link back to customer
credit.customerId = "CUST001"
credit.customerName = "John Smith"
```

### **Customer → Invoices**
```javascript
// Customer has invoiceIds array
customer.invoiceIds = ["INV001", "INV005", "INV009"]

// Invoices link back to customer
invoice.customerId = "CUST001"
invoice.customerName = "John Smith"
```

### **Invoice → Credits**
```javascript
// Invoice tracks applied credits
invoice.appliedCreditIds = ["CREDIT004"]
invoice.creditsApplied = 1200.00

// Invoice can generate credits
invoice.earnedCreditIds = ["CREDIT001"]

// Credits track source invoice
credit.sourceInvoiceId = "INV001"
```

## 🛠️ **Helper Functions**

### **Customer Queries**
- `getCustomerById(customerId)` - Find customer by ID
- `getCustomerByName(customerName)` - Find customer by name
- `getCustomerCredits(customerId)` - Get all customer credits
- `getCustomerInvoices(customerId)` - Get all customer invoices
- `getCustomerActiveCredits(customerId)` - Get active credits only
- `getCustomerTotalActiveCredits(customerId)` - Calculate total active credits

### **Credit Queries**
- `getCreditById(creditId)` - Find credit by ID
- `getCreditsByCustomer(customerId)` - Get credits for customer
- `getExpiredCredits()` - Get all expired credits
- `getActiveCredits()` - Get all active credits

### **Invoice Queries**
- `getInvoiceById(invoiceId)` - Find invoice by ID
- `getInvoicesByCustomer(customerId)` - Get invoices for customer
- `getPendingInvoices()` - Get all pending invoices
- `getPaidInvoices()` - Get all paid invoices
- `getCustomerLatestInvoice(customerId)` - Get customer's latest invoice

### **Relational Queries**
- `getCustomerWithCreditsAndInvoices(customerId)` - Full customer data
- `getInvoiceWithCustomerAndCredits(invoiceId)` - Full invoice data
- `getCreditWithCustomerAndInvoice(creditId)` - Full credit data

### **Data Manipulation**
- `applyCreditsToInvoice(invoiceId, creditIds, amounts)` - Apply credits
- `getCustomerPurchaseHistory(customerId)` - Detailed purchase history

## 📊 **Sample Data Relationships**

### **Customer CUST001 (John Smith)**
- **Credits**: CREDIT001 ($500), CREDIT002 ($250), CREDIT007 ($150)
- **Invoices**: INV001 ($2,500), INV005 ($1,200), INV009 (pending)
- **Total Active Credits**: $900
- **Business**: Smith Auto Repair

### **Invoice INV003 (Mike Wilson)**
- **Original Amount**: $8,200
- **Current Amount**: $7,000 (after $1,200 credit applied)
- **Applied Credit**: CREDIT004 ($1,200 for quantity discrepancy)
- **Status**: Paid
- **Generated Credit**: CREDIT004 (quantity discrepancy compensation)

### **Credit CREDIT002 (John Smith)**
- **Original Amount**: $300
- **Current Amount**: $250 (partially used)
- **Source**: INV005 (damage compensation)
- **Usage History**: $50 applied to INV009 on 2024-03-01
- **Status**: partially_used

## ✅ **Benefits of New Structure**

### **🎯 Realistic Database Design**
- **Proper normalization** - No data duplication
- **Referential integrity** - All relationships maintained through IDs
- **Scalable structure** - Easy to add new entities
- **Real-world patterns** - Mirrors actual database design

### **🔧 Better Development Experience**
- **Separate concerns** - Each entity in its own file
- **Easy maintenance** - Update one entity without affecting others
- **Clear relationships** - Explicit ID-based connections
- **Helper functions** - Convenient query methods

### **🚀 Enhanced Functionality**
- **Complex queries** - Join data across entities
- **Data integrity** - Consistent relationships
- **Rich data** - Detailed, realistic information
- **Usage tracking** - Credit usage history and audit trails

### **🧪 Better Testing**
- **Isolated testing** - Test individual entities
- **Relationship testing** - Verify connections work correctly
- **Data consistency** - Ensure referential integrity
- **Realistic scenarios** - Test with real-world data patterns

## 🎉 **Ready for Production**

The new relational mock database structure provides:
- ✅ **Realistic data relationships** like a real database
- ✅ **Comprehensive helper functions** for easy data access
- ✅ **Detailed, rich data** for thorough testing
- ✅ **Scalable architecture** for future enhancements
- ✅ **Clean separation** of concerns and entities
- ✅ **Full backward compatibility** with existing code

This structure makes the application much more realistic and provides a solid foundation for further development! 🎯
