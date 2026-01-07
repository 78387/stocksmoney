import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  pricing: {
    INR: {
      price: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        default: 'INR'
      },
      symbol: {
        type: String,
        default: '₹'
      }
    },
    GBP: {
      price: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        default: 'GBP'
      },
      symbol: {
        type: String,
        default: '£'
      }
    }
  },
  // Legacy price field for backward compatibility
  price: {
    type: Number,
    min: 0
  },
  image: {
    type: String,
    default: '/placeholder-product.jpg'
  },
  category: {
    type: String,
    default: 'Digital Product'
  },
  deadlineDays: {
    type: Number,
    required: true,
    min: 1,
    default: 30
  },
  dailyCommission: {
    type: Number,
    default: 0,
    min: 0
  },
  commissionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // percentage
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  stock: {
    type: Number,
    default: 999,
    min: 0
  },
  availableCountries: [{
    type: String,
    enum: ['IN', 'GB'],
    default: ['IN', 'GB']
  }],
  targetCountry: {
    type: String,
    enum: ['IN', 'GB', 'BOTH'],
    default: 'BOTH'
  }
}, {
  timestamps: true
});

// Virtual to get price for specific country
ProductSchema.virtual('getPriceForCountry').get(function() {
  return function(countryCode = 'IN') {
    if (this.pricing && this.pricing[countryCode]) {
      return this.pricing[countryCode];
    }
    // Fallback to legacy price for INR
    if (countryCode === 'IN' && this.price) {
      return {
        price: this.price,
        currency: 'INR',
        symbol: '₹'
      };
    }
    // Default fallback
    return this.pricing?.INR || { price: this.price || 0, currency: 'INR', symbol: '₹' };
  };
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
