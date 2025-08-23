/**
 * Invoice Model - MongoDB Schema
 * ==============================
 * 
 * Defines the Invoice schema with relationships to Customers and Credits
 */

const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  partNumber: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1
  },
  unitPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  totalPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  category: { 
    type: String, 
    required: true,
    enum: ['rebuild_kit', 'parts', 'labor', 'shipping', 'misc', 'torque_converter', 'filter_kit', 'fluid', 'transmission', 'hardware', 'service_kit', 'gasket', 'overhaul_kit', 'additive']
  }
}, { _id: false });

const taxSchema = new mongoose.Schema({
  salesTax: { 
    type: Number, 
    required: true,
    min: 0
  },
  taxRate: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100
  },
  taxExempt: { 
    type: Boolean, 
    default: false 
  }
}, { _id: false });

const shippingSchema = new mongoose.Schema({
  cost: { 
    type: Number, 
    required: true,
    min: 0
  },
  method: { 
    type: String, 
    required: true,
    enum: ['pickup', 'standard', 'express', 'overnight', 'freight']
  },
  trackingNumber: { 
    type: String,
    default: null
  }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  customerId: { 
    type: String, 
    required: true,
    ref: 'Customer',
    index: true
  },
  customerName: { 
    type: String, 
    required: true,
    index: true
  },
  date: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  dueDate: { 
    type: Date, 
    required: true
  },
  originalAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  currentAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  creditsApplied: { 
    type: Number, 
    default: 0,
    min: 0
  },
  appliedCreditIds: [{ 
    type: String,
    ref: 'Credit'
  }],
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentDate: { 
    type: Date,
    default: null
  },
  description: { 
    type: String, 
    required: true 
  },
  items: [itemSchema],
  taxes: {
    type: taxSchema,
    required: true
  },
  shipping: {
    type: shippingSchema,
    required: true
  },
  notes: { 
    type: String,
    default: ''
  },
  earnedCreditIds: [{ 
    type: String,
    ref: 'Credit'
  }],
  relatedCreditMemos: [{ 
    type: String 
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for customer
invoiceSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: 'id',
  justOne: true
});

// Virtual for applied credits
invoiceSchema.virtual('appliedCredits', {
  ref: 'Credit',
  localField: 'appliedCreditIds',
  foreignField: 'id'
});

// Virtual for earned credits
invoiceSchema.virtual('earnedCredits', {
  ref: 'Credit',
  localField: 'earnedCreditIds',
  foreignField: 'id'
});

// Virtual to check if invoice is overdue
invoiceSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate && this.status === 'pending';
});

// Virtual for total items count
invoiceSchema.virtual('itemCount').get(function() {
  return this.items.length;
});

// Index for efficient queries
invoiceSchema.index({ customerId: 1, status: 1 });
invoiceSchema.index({ date: -1 });
invoiceSchema.index({ dueDate: 1, status: 1 });
invoiceSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
