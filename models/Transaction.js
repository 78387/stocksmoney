import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdraw', 'reward', 'purchase', 'referral'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  utr: {
    type: String,
    trim: true
  },
  proofImage: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'completed'
  },
  reason: {
    type: String,
    trim: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  processedAt: {
    type: Date
  },
  // QR Code tracking for deposits
  qrCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QRCode'
  },
  qrCodeUsed: {
    name: String,
    upiId: String
  },
  withdrawalDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String,
    upiId: String
  },
  referralData: {
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    referredUserName: String,
    referredUserEmail: String
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ createdAt: -1 });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
