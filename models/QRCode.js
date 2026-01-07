import mongoose from 'mongoose';

// Delete existing model to force recreation
if (mongoose.models.QRCode) {
  delete mongoose.models.QRCode;
}

const QRCodeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  upiId: {
    type: String,
    trim: true,
    default: '',
    required: false  // Explicitly set to false
  },
  qrImage: {
    type: String,
    required: true
  },
  country: {
    code: {
      type: String,
      required: true,
      default: 'IN'
    },
    name: {
      type: String,
      required: true,
      default: 'India'
    },
    currency: {
      type: String,
      required: true,
      default: 'INR'
    }
  },
  paymentMethod: {
    type: String,
    default: 'UPI'
  },
  bankDetails: {
    accountNumber: { type: String, default: '' },
    sortCode: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountHolderName: { type: String, default: '' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalDeposits: {
    type: Number,
    default: 0
  },
  totalTransactions: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
QRCodeSchema.index({ isActive: 1, 'country.code': 1 });
QRCodeSchema.index({ totalDeposits: -1 });
QRCodeSchema.index({ 'country.code': 1 });

export default mongoose.model('QRCode', QRCodeSchema);
