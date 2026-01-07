# Balance Fix Instructions

## Problem
Deposit balance not showing when user deposits money - only total balance is updating.

## Root Cause
Existing users don't have `depositBalance` and `rewardBalance` fields initialized in the database.

## Solution Steps

### 1. Start your server
```bash
npm run dev
```

### 2. Run the comprehensive balance fix (ONE TIME ONLY)
```bash
# Replace PORT with your actual port (3000, 3001, 3002, etc.)
curl -X POST http://localhost:PORT/api/comprehensive-balance-fix
```

### 3. Test the balance display
```bash
# Check a user's balance (need to be logged in)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:PORT/api/test-balance
```

## What the fix does:

1. **Initializes balance fields** for all existing users
2. **Recalculates balances** based on transaction history:
   - `depositBalance` = sum of approved deposits - purchases (deposit first)
   - `rewardBalance` = sum of rewards/referrals - withdrawals
   - `balance` = depositBalance + rewardBalance

3. **Updates all APIs** to use `$set` instead of `$inc` to avoid undefined field issues

## After running the fix:

✅ Deposit balance will show correctly when admin approves deposits
✅ Reward balance will show correctly when rewards are processed  
✅ Withdrawal will only work from reward balance
✅ Purchases will deduct from deposit balance first, then reward balance

## Files Updated:

- `models/User.js` - Added depositBalance and rewardBalance fields
- `app/api/admin/transactions/[id]/route.js` - Fixed deposit approval logic
- `app/api/transactions/route.js` - Fixed withdrawal logic  
- `app/api/rewards/process/route.js` - Fixed reward processing
- `app/api/orders/route.js` - Fixed purchase logic
- `app/api/user/profile/route.js` - Returns all balance fields
- `app/dashboard/wallet/page.tsx` - Shows separate balance cards

## Test Scenario:

1. User deposits ₹1000 → Admin approves → `depositBalance` shows ₹1000
2. User gets ₹100 reward → `rewardBalance` shows ₹100  
3. User tries to withdraw ₹50 → Only works if `rewardBalance` ≥ ₹50
4. User buys ₹200 product → Deducts from `depositBalance` first

## Troubleshooting:

If balance still not showing:
1. Check server logs for errors
2. Verify MongoDB connection
3. Run the test endpoint to see raw balance data
4. Clear browser cache and refresh
