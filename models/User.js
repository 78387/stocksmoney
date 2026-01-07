import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[6-9]\d{9}$/.test(v); // Indian mobile number validation
      },
      message: 'Please enter a valid 10-digit mobile number'
    }
  },
  country: {
    code: {
      type: String,
      enum: ['IN', 'GB'],
      default: 'IN'
    },
    name: {
      type: String,
      enum: ['India', 'United Kingdom'],
      default: 'India'
    },
    currency: {
      type: String,
      enum: ['INR', 'GBP'],
      default: 'INR'
    },
    symbol: {
      type: String,
      enum: ['₹', '£'],
      default: '₹'
    }
  },
  ipAddress: {
    type: String,
    default: null
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true, // Allows null values while maintaining uniqueness
    trim: true
  },
  referredBy: {
    type: String,
    default: null,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  depositBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  rewardBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String,
    upiId: String
  },
  status: {
    type: String,
    enum: ['active', 'blocked', 'pending'],
    default: 'active'
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
