import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "super_admin"],
      default: "admin",
    },
    permissions: {
      // Admin permissions
      manageUsers: { type: Boolean, default: true },
      manageDeposits: { type: Boolean, default: true },
      manageProducts: { type: Boolean, default: true },
      manageQRCodes: { type: Boolean, default: true },
      
      // Super admin only permissions
      manageWithdrawals: { type: Boolean, default: false },
      manageOrders: { type: Boolean, default: false },
      manageAdmins: { type: Boolean, default: false },
      viewQRAnalytics: { type: Boolean, default: false },
      viewReports: { type: Boolean, default: false },
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Set permissions based on role
AdminSchema.pre('save', function(next) {
  if (this.role === 'super_admin') {
    this.permissions = {
      manageUsers: true,
      manageDeposits: true,
      manageProducts: true,
      manageQRCodes: true,
      manageWithdrawals: true,
      manageOrders: true,
      manageAdmins: true,
      viewQRAnalytics: true,
      viewReports: true,
    };
  } else {
    this.permissions = {
      manageUsers: true,
      manageDeposits: true,
      manageProducts: true,
      manageQRCodes: true,
      manageWithdrawals: false,
      manageOrders: false,
      manageAdmins: false,
      viewQRAnalytics: false,
      viewReports: false,
    };
  }
  next();
});

export default mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
