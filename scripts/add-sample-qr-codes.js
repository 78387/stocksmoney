// Script to add sample QR codes to the database
// Run this after setting up the QR system

const mongoose = require('mongoose');

// QR Code Schema (copy from your model)
const QRCodeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  upiId: {
    type: String,
    required: true,
    trim: true
  },
  qrImage: {
    type: String,
    required: true
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
    ref: 'Admin',
    required: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const QRCode = mongoose.model('QRCode', QRCodeSchema);

// Admin Schema (simplified)
const AdminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String
});

const Admin = mongoose.model('Admin', AdminSchema);

async function addSampleQRCodes() {
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

    // Sample QR codes data
    const sampleQRCodes = [
      {
        name: 'Main Payment Account',
        upiId: 'stocksmoney@paytm',
        qrImage: 'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=QR+1',
        description: 'Primary payment account for deposits',
        createdBy: admin._id
      },
      {
        name: 'Secondary Account',
        upiId: 'payments@phonepe',
        qrImage: 'https://via.placeholder.com/200x200/059669/FFFFFF?text=QR+2',
        description: 'Secondary payment account',
        createdBy: admin._id
      },
      {
        name: 'Backup Account',
        upiId: 'backup@gpay',
        qrImage: 'https://via.placeholder.com/200x200/DC2626/FFFFFF?text=QR+3',
        description: 'Backup payment account',
        createdBy: admin._id
      }
    ];

    // Check if QR codes already exist
    const existingQRs = await QRCode.find();
    if (existingQRs.length > 0) {
      console.log('QR codes already exist. Skipping creation.');
      return;
    }

    // Insert sample QR codes
    const result = await QRCode.insertMany(sampleQRCodes);
    console.log(`Successfully created ${result.length} sample QR codes:`);
    
    result.forEach((qr, index) => {
      console.log(`${index + 1}. ${qr.name} - ${qr.upiId}`);
    });

  } catch (error) {
    console.error('Error adding sample QR codes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addSampleQRCodes();
