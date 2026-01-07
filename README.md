# StocksMoney - Digital Products Platform

A complete production-ready fullstack web application built with **Next.js (App Router)**, **MongoDB**, and **TailwindCSS** for buying and selling digital products with a secure wallet system.

## 🚀 Features

### User Features
- **Authentication**: Secure login/register with JWT tokens
- **Product Marketplace**: Browse and purchase digital products
- **Wallet System**: Deposit and withdraw money with admin approval
- **Order Management**: Track purchase history
- **Profile Management**: Update personal and bank details
- **Mobile Responsive**: Optimized for all devices

### Admin Features
- **Dashboard**: Overview of platform statistics
- **User Management**: View, edit, block/unblock users
- **Deposit Management**: Approve/reject deposit requests with UTR verification
- **Withdrawal Management**: Process withdrawal requests to bank/UPI
- **Data Export**: Export user data to CSV
- **Real-time Statistics**: Track active users, transactions, and more

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Styling**: TailwindCSS
- **Authentication**: JWT tokens with bcryptjs
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📁 Project Structure

```
stocksmoney/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── profile/
│   │   ├── wallet/
│   │   └── more/
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── deposits/
│   │   └── withdrawals/
│   ├── api/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── transactions/
│   │   └── admin/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── db.js
│   └── auth.js
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   ├── Transaction.js
│   └── Admin.js
├── .env.local
├── package.json
├── tailwind.config.js
└── next.config.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account or local MongoDB
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stocksmoney
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   The `.env.local` file is already configured with your MongoDB connection:
   ```env
   MONGODB_URI="mongodb+srv://vishalsingh25269:Vishal12@cluster0.rvdbmqf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   NEXTAUTH_SECRET="your-nextauth-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### For Users

1. **Register/Login**: Create an account or sign in
2. **Browse Products**: View available digital products
3. **Add Money**: Deposit funds using UPI with UTR verification
4. **Purchase Products**: Buy products using wallet balance
5. **Withdraw Money**: Request withdrawals to bank account or UPI
6. **Track Orders**: View purchase history and order status

### For Admins

1. **Admin Login**: Access admin panel at `/admin/login`
   - Default credentials: `admin@stocksmoney.com` / `admin123`
2. **Dashboard**: View platform statistics and quick actions
3. **Manage Users**: Edit user details, block/unblock accounts
4. **Process Deposits**: Review UTR and proof images, approve/reject
5. **Handle Withdrawals**: Process withdrawal requests to user accounts
6. **Export Data**: Download user data in CSV format

## 🔐 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **Protected Routes**: Authentication required for sensitive operations
- **Admin Authorization**: Separate admin authentication system
- **Transaction Security**: Multi-step verification for financial operations

## 💳 Wallet System

### Deposit Flow
1. User enters amount (minimum ₹500)
2. System shows QR code for payment
3. User makes UPI payment and enters UTR
4. User uploads payment proof image
5. Admin reviews and approves/rejects
6. On approval, amount is added to wallet

### Withdrawal Flow
1. User enters amount and bank/UPI details
2. Amount is immediately deducted from wallet
3. Admin processes the withdrawal request
4. On approval, money is sent to user account
5. On rejection, amount is refunded to wallet

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: Clean and modern interface
- **Loading States**: Smooth loading animations
- **Toast Notifications**: Real-time feedback for user actions
- **Fixed Bottom Navigation**: Easy mobile navigation
- **Modal Dialogs**: Intuitive forms and confirmations

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  balance: Number,
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String,
    upiId: String
  },
  status: String (active/blocked),
  isOnline: Boolean,
  lastLogin: Date
}
```

### Transaction Model
```javascript
{
  userId: ObjectId,
  type: String (deposit/withdraw),
  amount: Number,
  utr: String,
  proofImage: String,
  status: String (pending/approved/rejected/completed),
  reason: String,
  withdrawalDetails: Object,
  createdAt: Date,
  processedAt: Date
}
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Manual Deployment
1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Configure environment variables on your server

## 🔧 Configuration

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `NEXTAUTH_SECRET`: NextAuth secret key
- `NEXTAUTH_URL`: Application URL

### Customization
- **Colors**: Modify `tailwind.config.js` for theme colors
- **Products**: Add sample products via `/api/products` POST endpoint
- **Company Info**: Update company details in `/dashboard/more/page.tsx`

## 📈 Performance

- **Server-Side Rendering**: Fast initial page loads
- **API Route Optimization**: Efficient database queries
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic code splitting for faster loads
- **Caching**: MongoDB connection caching

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify MONGODB_URI in .env.local
   - Check MongoDB Atlas network access settings

2. **Authentication Issues**
   - Clear browser cookies and localStorage
   - Verify JWT_SECRET is set correctly

3. **Build Errors**
   - Run `npm install` to ensure all dependencies
   - Check TypeScript errors with `npm run lint`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Email: support@stocksmoney.com
- Phone: +91 98765 43210

## 🎯 Future Enhancements

- [ ] Email notifications for transactions
- [ ] SMS OTP verification
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Referral system
- [ ] KYC verification

---

**Built with ❤️ using Next.js, MongoDB, and TailwindCSS**
