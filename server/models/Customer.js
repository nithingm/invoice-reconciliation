/**
 * Customer Model - MongoDB Schema
 * ===============================
 * 
 * Defines the Customer schema with relationships to Credits and Invoices
 */

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'USA' }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  name: { 
    type: String, 
    required: true,
    index: true
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  phone: { 
    type: String, 
    required: true 
  },
  joinDate: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  address: {
    type: addressSchema,
    required: true
  },
  company: { 
    type: String, 
    required: true,
    index: true
  },
  businessType: { 
    type: String, 
    required: true 
  },
  creditIds: [{ 
    type: String,
    ref: 'Credit'
  }],
  invoiceIds: [{ 
    type: String,
    ref: 'Invoice'
  }],
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  creditLimit: { 
    type: Number, 
    required: true,
    min: 0
  },
  paymentTerms: { 
    type: String, 
    required: true,
    enum: ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'COD']
  },
  preferredContact: { 
    type: String, 
    enum: ['email', 'phone', 'mail'],
    default: 'email'
  },
  notes: { 
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for credits
customerSchema.virtual('credits', {
  ref: 'Credit',
  localField: 'id',
  foreignField: 'customerId'
});

// Virtual for invoices
customerSchema.virtual('invoices', {
  ref: 'Invoice',
  localField: 'id',
  foreignField: 'customerId'
});

// Index for efficient queries
customerSchema.index({ name: 'text', company: 'text' });
customerSchema.index({ status: 1, joinDate: -1 });

module.exports = mongoose.model('Customer', customerSchema);
