import mongoose from 'mongoose';

const CommissionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['platform', 'product'],
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100 // percentage
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: function() { return this.type === 'product'; }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Commission || mongoose.model('Commission', CommissionSchema);
