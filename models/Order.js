import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active'
  },
  paymentMethod: {
    type: String,
    enum: ['wallet', 'upi', 'card'],
    default: 'wallet'
  },
  commission: {
    rate: {
      type: Number,
      default: 0
    },
    dailyAmount: {
      type: Number,
      default: 0
    },
    totalEarned: {
      type: Number,
      default: 0
    },
    lastCalculated: {
      type: Date,
      default: Date.now
    }
  },
  lastRewardDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ expiryDate: 1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
