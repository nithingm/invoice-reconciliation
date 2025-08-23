# 🗄️ MongoDB Database Structure

## 🎯 Overview

The application now uses a robust MongoDB database with Mongoose schemas to ensure data integrity, validation, and scalability. This professional structure replaces the previous mock data files.

## 📁 Database Collections

The database, named `transmission-portal`, consists of three main collections:

-   `customers`: Stores all customer information.
-   `credits`: Contains all credit records, linked to customers.
-   `invoices`: Holds all invoice data, linked to customers and credits.

--- 

### **📋 `customers` Collection (Mongoose Model: `Customer`)

**Fields**:
-   `id`: `String`, required, unique, indexed
-   `name`: `String`, required, indexed
-   `email`: `String`, required, unique, lowercase
-   `phone`: `String`, required
-   `joinDate`: `Date`, required, default: `Date.now`
-   `address`: `Object` (sub-document with street, city, state, etc.)
-   `company`: `String`, required, indexed
-   `businessType`: `String`, required
-   `creditIds`: `Array<String>`, ref: `Credit`
-   `invoiceIds`: `Array<String>`, ref: `Invoice`
-   `status`: `String`, enum: `['active', 'inactive', 'suspended']`, default: `'active'`
-   `creditLimit`: `Number`, required, min: 0
-   `paymentTerms`: `String`, required, enum: `['Net 15', 'Net 30', ...]`
-   `preferredContact`: `String`, enum: `['email', 'phone', 'mail']`, default: `'email'`
-   `notes`: `String`
-   `createdAt`, `updatedAt`: `Date`, automatic timestamps

**Virtuals**:
-   `credits`: Populates all credits for the customer.
-   `invoices`: Populates all invoices for the customer.

--- 

### **💳 `credits` Collection (Mongoose Model: `Credit`)**

**Fields**:
-   `id`: `String`, required, unique, indexed
-   `customerId`: `String`, required, ref: `Customer`
-   `customerName`: `String`, required
-   `amount`: `Number`, required, min: 0
-   `originalAmount`: `Number`, required, min: 0
-   `status`: `String`, enum: `['active', 'partially_used', 'used', 'expired']`, default: `'active'`
-   `earnedDate`: `Date`, required, default: `Date.now`
-   `expiryDate`: `Date`, required
-   `sourceInvoiceId`: `String`, ref: `Invoice`
-   `sourceType`: `String`, required, enum
-   `description`: `String`, required
-   `category`: `String`, required, enum
-   `usageHistory`: `Array<Object>` (sub-document schema)
-   `notes`: `String`
-   `createdAt`, `updatedAt`: `Date`, automatic timestamps

**Virtuals**:
-   `customer`: Populates the parent customer.
-   `sourceInvoice`: Populates the source invoice.
-   `isExpired`: Computed boolean property.

---

### **🧾 `invoices` Collection (Mongoose Model: `Invoice`)**

**Fields**:
-   `id`: `String`, required, unique, indexed
-   `customerId`: `String`, required, ref: `Customer`
-   `customerName`: `String`, required
-   `date`: `Date`, required, default: `Date.now`
-   `dueDate`: `Date`, required
-   `originalAmount`: `Number`, required, min: 0
-   `currentAmount`: `Number`, required, min: 0
-   `creditsApplied`: `Number`, default: 0
-   `appliedCreditIds`: `Array<String>`, ref: `Credit`
-   `status`: `String`, enum: `['pending', 'paid', 'overdue', 'cancelled']`, default: `'pending'`
-   `paymentStatus`: `String`, enum
-   `paymentDate`: `Date`
-   `description`: `String`, required
-   `items`: `Array<Object>` (sub-document schema)
-   `taxes`: `Object` (sub-document schema)
-   `shipping`: `Object` (sub-document schema)
-   `notes`: `String`
-   `earnedCreditIds`: `Array<String>`, ref: `Credit`
-   `createdAt`, `updatedAt`: `Date`, automatic timestamps

**Virtuals**:
-   `customer`: Populates the parent customer.
-   `appliedCredits`: Populates all applied credits.
-   `isOverdue`: Computed boolean property.

## ✅ Benefits of New Structure

-   **Data Integrity**: Mongoose schemas enforce data types and validation rules.
-   **Scalability**: MongoDB is built for high-performance, scalable applications.
-   **Powerful Queries**: Leverage MongoDB's rich query language for complex data retrieval.
-   **Formal Relationships**: Use `populate` to easily manage relationships between collections.
-   **Production Ready**: This architecture is robust and suitable for a production environment.