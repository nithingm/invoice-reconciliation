/**
 * Credit Model - MongoDB Schema
 * =============================
 * 
 * Defines the Credit schema with relationships to Customers and Invoices
 */

const mongoose = require('mongoose');

const usageHistorySchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  appliedToInvoice: { 
    type: String,
    ref: 'Invoice'
  },
  description: { 
    type: String, 
    required: true 
  }
}, { _id: false });

const creditSchema = new mongoose.Schema({
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
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  originalAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  status: { 
    type: String, 
    enum: ['active', 'partially_used', 'used', 'expired'],
    default: 'active',
    index: true
  },
  earnedDate: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  expiryDate: { 
    type: Date, 
    required: true,
    index: true
  },
  sourceInvoiceId: { 
    type: String,
    ref: 'Invoice'
  },
  sourceType: { 
    type: String, 
    required: true,
    enum: ['purchase_reward', 'damage_compensation', 'quantity_discrepancy', 'loyalty_bonus', 'refund', 'promotional', 'bulk_discount_refund', 'early_payment_bonus', 'welcome_bonus', 'loyalty_reward', 'referral_bonus', 'volume_discount', 'quality_issue']
  },
  description: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true,
    enum: ['loyalty_reward', 'damage_credit', 'discrepancy_credit', 'promotional_credit', 'refund_credit', 'pricing_adjustment', 'quantity_adjustment', 'payment_incentive', 'promotional', 'seasonal_promotion', 'referral', 'volume_incentive', 'quality_adjustment']
  },
  usageHistory: [usageHistorySchema],
  notes: { 
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for customer
creditSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: 'id',
  justOne: true
});

// Virtual for source invoice
creditSchema.virtual('sourceInvoice', {
  ref: 'Invoice',
  localField: 'sourceInvoiceId',
  foreignField: 'id',
  justOne: true
});

// Virtual to check if credit is expired
creditSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Virtual to check if credit is available
creditSchema.virtual('isAvailable').get(function() {
  return this.amount > 0 && !this.isExpired && (this.status === 'active' || this.status === 'partially_used');
});

// Index for efficient queries
creditSchema.index({ customerId: 1, status: 1 });
creditSchema.index({ expiryDate: 1, status: 1 });
creditSchema.index({ earnedDate: -1 });

module.exports = mongoose.model('Credit', creditSchema);
