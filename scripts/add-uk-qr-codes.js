// Script to add UK-specific QR codes to the database
const mongoose = require('mongoose');

// QR Code Schema (updated with country support)
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
    required: false
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

const QRCode = mongoose.model('QRCode', QRCodeSchema);

// Admin Schema
const AdminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String
});

const Admin = mongoose.model('Admin', AdminSchema);

async function addUKQRCodes() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://vishalsingh25269:Vishal12@cluster0.rvdbmqf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    
    console.log('Connected to MongoDB');

    // Find the first admin
    const admin = await Admin.findOne();
    if (!admin) {
      console.log('No admin found. Please create an admin first.');
      return;
    }

    // UK-specific QR codes data
    const ukQRCodes = [
      {
        name: 'UK Main Account',
        upiId: '', // UK doesn't use UPI
        qrImage: 'https://via.placeholder.com/200x200/1E40AF/FFFFFF?text=UK+QR+1',
        country: {
          code: 'GB',
          name: 'United Kingdom',
          currency: 'GBP'
        },
        paymentMethod: 'Bank Transfer',
        bankDetails: {
          accountNumber: '12345678',
          sortCode: '12-34-56',
          bankName: 'Barclays Bank',
          accountHolderName: 'StocksMoney UK Ltd'
        },
        description: 'Primary UK payment account for deposits',
        createdBy: admin._id
      },
      {
        name: 'UK Secondary Account',
        upiId: '',
        qrImage: 'https://via.placeholder.com/200x200/7C3AED/FFFFFF?text=UK+QR+2',
        country: {
          code: 'GB',
          name: 'United Kingdom',
          currency: 'GBP'
        },
        paymentMethod: 'Bank Transfer',
        bankDetails: {
          accountNumber: '87654321',
          sortCode: '65-43-21',
          bankName: 'HSBC Bank',
          accountHolderName: 'StocksMoney UK Ltd'
        },
        description: 'Secondary UK payment account',
        createdBy: admin._id
      }
    ];

    // Check if UK QR codes already exist
    const existingUKQRs = await QRCode.find({ 'country.code': 'GB' });
    if (existingUKQRs.length > 0) {
      console.log('UK QR codes already exist. Skipping creation.');
      console.log('Existing UK QR codes:', existingUKQRs.length);
      return;
    }

    // Insert UK QR codes
    const result = await QRCode.insertMany(ukQRCodes);
    console.log(`Successfully created ${result.length} UK QR codes:`);
    
    result.forEach((qr, index) => {
      console.log(`${index + 1}. ${qr.name} - ${qr.country.name} (${qr.paymentMethod})`);
    });

    // Also add some Indian QR codes if they don't exist
    const existingINQRs = await QRCode.find({ 'country.code': 'IN' });
    if (existingINQRs.length === 0) {
      const indianQRCodes = [
        {
          name: 'India Main Account',
          upiId: 'stocksmoney@paytm',
          qrImage: 'https://via.placeholder.com/200x200/F97316/FFFFFF?text=IN+QR+1',
          country: {
            code: 'IN',
            name: 'India',
            currency: 'INR'
          },
          paymentMethod: 'UPI',
          description: 'Primary Indian payment account for deposits',
          createdBy: admin._id
        },
        {
          name: 'India Secondary Account',
          upiId: 'payments@phonepe',
          qrImage: 'https://via.placeholder.com/200x200/059669/FFFFFF?text=IN+QR+2',
          country: {
            code: 'IN',
            name: 'India',
            currency: 'INR'
          },
          paymentMethod: 'UPI',
          description: 'Secondary Indian payment account',
          createdBy: admin._id
        }
      ];

      const indianResult = await QRCode.insertMany(indianQRCodes);
      console.log(`Also created ${indianResult.length} Indian QR codes:`);
      
      indianResult.forEach((qr, index) => {
        console.log(`${index + 1}. ${qr.name} - ${qr.upiId}`);
      });
    }

  } catch (error) {
    console.error('Error adding QR codes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addUKQRCodes();
