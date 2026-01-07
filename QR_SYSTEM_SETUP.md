# QR Code Management System Setup

## Overview
The QR Code Management System allows admins to manage multiple payment QR codes and automatically assigns random QR codes to users during deposits. This helps distribute payment load across multiple accounts and provides detailed tracking.

## Features Implemented

### 1. **Multiple QR Code Management**
- Admin can add, edit, delete, and activate/deactivate QR codes
- Each QR code has name, UPI ID, image, and description
- Real-time statistics tracking for each QR code

### 2. **Random QR Selection**
- Users get a random QR code for each deposit
- Only active QR codes are selected
- QR code usage is tracked with timestamps

### 3. **Detailed Analytics**
- Track total deposits per QR code
- Count total transactions per QR code
- Calculate average deposit amount
- View recent transactions for each QR code

### 4. **Enhanced Deposit Flow**
- User selects deposit amount
- System automatically fetches random QR code
- User sees actual QR code image with UPI details
- Deposit is linked to specific QR code for tracking

## Files Created/Modified

### New Files:
1. `models/QRCode.js` - QR Code database model
2. `app/api/admin/qr-codes/route.js` - QR management API
3. `app/api/user/get-random-qr/route.js` - Random QR selection API
4. `app/admin/qr-codes/page.js` - Admin QR management interface
5. `scripts/add-sample-qr-codes.js` - Sample data script

### Modified Files:
1. `models/Transaction.js` - Added QR tracking fields
2. `app/api/transactions/route.js` - Updated deposit flow
3. `app/api/admin/transactions/route.js` - Added QR statistics
4. `app/dashboard/wallet/page.tsx` - Updated user deposit flow
5. `app/admin/layout.tsx` - Added QR Codes navigation

## Database Schema Changes

### QRCode Model:
```javascript
{
  name: String,           // QR code name (e.g., "Main Account")
  upiId: String,          // UPI ID for payments
  qrImage: String,        // QR code image URL
  isActive: Boolean,      // Active/inactive status
  totalDeposits: Number,  // Total amount deposited
  totalTransactions: Number, // Total transaction count
  lastUsed: Date,         // Last usage timestamp
  createdBy: ObjectId,    // Admin who created it
  description: String     // Optional description
}
```

### Transaction Model Updates:
```javascript
{
  // ... existing fields
  qrCodeId: ObjectId,     // Reference to QR code used
  qrCodeUsed: {           // QR code details snapshot
    name: String,
    upiId: String
  }
}
```

## Setup Instructions

### 1. **Install Dependencies**
No new dependencies required. Uses existing MongoDB and Next.js setup.

### 2. **Database Migration**
The new fields will be automatically added when you start using the system. Existing transactions will have null QR code references.

### 3. **Add Sample QR Codes**
Run the sample data script:
```bash
node scripts/add-sample-qr-codes.js
```

### 4. **Admin Setup**
1. Login to admin panel
2. Navigate to "QR Codes" in the sidebar
3. Add your actual QR codes with real UPI IDs and QR images
4. Activate the QR codes you want to use

### 5. **Replace Placeholder QR Images**
Update the QR code images with actual payment QR codes:
- Upload QR images to a cloud storage (AWS S3, Cloudinary, etc.)
- Update the `qrImage` field with actual URLs

## API Endpoints

### Admin APIs:
- `GET /api/admin/qr-codes` - Fetch all QR codes with statistics
- `POST /api/admin/qr-codes` - Create new QR code
- `PUT /api/admin/qr-codes` - Update QR code
- `DELETE /api/admin/qr-codes?id=<qrId>` - Delete QR code

### User APIs:
- `GET /api/user/get-random-qr` - Get random active QR code

## Admin Interface Features

### QR Codes Management Page:
- **Grid View**: Visual cards showing each QR code
- **Statistics**: Total deposits, transactions, and average amount
- **Actions**: Edit, activate/deactivate, view stats, delete
- **Add New**: Modal form to add new QR codes
- **Real-time Data**: Live statistics and recent transactions

### QR Code Statistics Modal:
- **Overview Cards**: Total deposits, transactions, average amount
- **Recent Transactions**: Last 5 transactions for the QR code
- **User Details**: Transaction amounts and user information

## User Experience Improvements

### Enhanced Deposit Flow:
1. User enters deposit amount
2. System fetches random QR code
3. User sees actual QR image with UPI details
4. User makes payment and enters UTR
5. System tracks which QR was used

### Benefits:
- **Load Distribution**: Payments spread across multiple accounts
- **Better Tracking**: Know which account received which payment
- **Scalability**: Easy to add more payment accounts
- **Analytics**: Detailed insights into payment patterns

## Security Features

- **Admin Only**: QR management restricted to admin users
- **Active QR Only**: Only active QR codes are shown to users
- **Validation**: Proper validation for UPI IDs and required fields
- **Transaction Linking**: Each deposit linked to specific QR code

## Monitoring & Analytics

### Admin Dashboard Insights:
- Which QR codes are most used
- Total deposits per QR code
- Transaction patterns and trends
- Recent activity for each QR code

### Reports Available:
- QR-wise deposit reports
- Transaction success rates
- User payment preferences
- Time-based usage patterns

## Troubleshooting

### Common Issues:

1. **No QR Codes Available**
   - Ensure at least one QR code is active
   - Check QR code creation in admin panel

2. **QR Images Not Loading**
   - Verify image URLs are accessible
   - Use HTTPS URLs for images
   - Consider using cloud storage for images

3. **Random Selection Not Working**
   - Check if QR codes are marked as active
   - Verify API endpoint is working
   - Check browser console for errors

### Database Queries for Debugging:
```javascript
// Check active QR codes
db.qrcodes.find({ isActive: true })

// Check QR usage in transactions
db.transactions.find({ qrCodeId: { $exists: true } })

// QR statistics
db.transactions.aggregate([
  { $match: { type: 'deposit', status: 'approved' } },
  { $group: { _id: '$qrCodeId', total: { $sum: '$amount' }, count: { $sum: 1 } } }
])
```

## Future Enhancements

### Planned Features:
- **QR Code Analytics Dashboard**: Detailed charts and graphs
- **Automatic QR Rotation**: Time-based QR code rotation
- **Load Balancing**: Smart QR selection based on usage
- **QR Code Health Monitoring**: Track success rates per QR
- **Bulk QR Management**: Import/export QR codes
- **QR Code Categories**: Group QR codes by type/purpose

### Integration Possibilities:
- **Payment Gateway Integration**: Direct API integration
- **SMS Notifications**: QR-specific payment confirmations
- **Webhook Support**: Real-time payment notifications
- **Mobile App**: QR code scanning in mobile app

## Support

For issues or questions regarding the QR system:
1. Check the troubleshooting section above
2. Review API responses in browser developer tools
3. Check MongoDB logs for database issues
4. Verify admin permissions for QR management

---

**Note**: Remember to replace placeholder QR images with actual payment QR codes before going live!
