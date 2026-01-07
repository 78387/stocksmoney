const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = "mongodb+srv://hoonneeshu10_db_user:hoonnesshu@cluster0.epvz4cn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Admin Schema
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["admin", "super_admin"], default: "admin" },
  permissions: {
    manageUsers: { type: Boolean, default: true },
    manageDeposits: { type: Boolean, default: true },
    manageProducts: { type: Boolean, default: true },
    manageQRCodes: { type: Boolean, default: true },
    manageWithdrawals: { type: Boolean, default: false },
    manageOrders: { type: Boolean, default: false },
    manageAdmins: { type: Boolean, default: false },
    viewQRAnalytics: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false },
  },
  lastLogin: { type: Date, default: Date.now },
}, { timestamps: true });

AdminSchema.pre('save', function(next) {
  if (this.role === 'super_admin') {
    this.permissions = {
      manageUsers: true, manageDeposits: true, manageProducts: true,
      manageQRCodes: true, manageWithdrawals: true, manageOrders: true,
      manageAdmins: true, viewQRAnalytics: true, viewReports: true,
    };
  }
  next();
});

const Admin = mongoose.model('Admin', AdminSchema);

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@stocksmoney.com' });
    if (existingAdmin) {
      console.log('Admin already exists!');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('HoonNeeshu@#12', 12);

    // Create admin
    const admin = new Admin({
      email: 'admin@stocksmoney.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'super_admin'
    });

    await admin.save();
    console.log('Admin created successfully!');
    console.log('Email: admin@stocksmoney.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
