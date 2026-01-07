# Balance System Setup Instructions

## What's Implemented

### 3 Separate Balances:
1. **Total Balance** = Deposit Balance + Reward Balance
2. **Deposit Balance** = Money deposited by user (cannot be withdrawn)
3. **Reward Balance** = Earnings from rewards/referrals (can be withdrawn)

### Key Features:
- ✅ Deposits go to `depositBalance` when admin approves
- ✅ Rewards/referrals go to `rewardBalance`
- ✅ Withdrawals only work from `rewardBalance`
- ✅ Total balance shows sum of both
- ✅ 3 separate balance cards in wallet UI

## Setup Steps

### 1. Start your server
```bash
npm run dev
```

### 2. Initialize balance fields for existing users (ONE TIME ONLY)
```bash
# Replace PORT with your actual port (3000, 3001, 3002, etc.)
curl -X POST http://localhost:PORT/api/initialize-balances
```

### 3. Test the system
1. Admin approves a deposit → Should show in deposit balance
2. User gets reward → Should show in reward balance  
3. User tries to withdraw → Only works if reward balance ≥ amount
4. Total balance = deposit balance + reward balance

## How It Works

### When User Deposits Money:
1. User submits deposit request
2. Admin approves → Money goes to `depositBalance` AND `balance`
3. User can see deposit amount in "Deposit Balance" card
4. This money CANNOT be withdrawn

### When User Gets Rewards:
1. Daily rewards or referral bonuses
2. Money goes to `rewardBalance` AND `balance`  
3. User can see reward amount in "Reward Balance" card
4. This money CAN be withdrawn

### When User Withdraws:
1. System checks `rewardBalance` only
2. If sufficient → Deducts from `rewardBalance` AND `balance`
3. `depositBalance` remains unchanged
4. User can only withdraw earned money, not deposited money

## Files Modified:
- `models/User.js` - Added depositBalance and rewardBalance fields
- `app/api/admin/transactions/[id]/route.js` - Deposit approval logic
- `app/api/transactions/route.js` - Withdrawal restriction logic
- `app/api/rewards/process/route.js` - Reward processing
- `app/api/user/profile/route.js` - Returns all balance fields
- `app/dashboard/wallet/page.tsx` - 3 balance cards UI

## Example Scenario:
1. User deposits ₹1000 → Admin approves
   - Deposit Balance: ₹1000
   - Reward Balance: ₹0  
   - Total Balance: ₹1000

2. User gets ₹100 daily reward
   - Deposit Balance: ₹1000
   - Reward Balance: ₹100
   - Total Balance: ₹1100

3. User tries to withdraw ₹50
   - ✅ Success (reward balance ≥ ₹50)
   - Deposit Balance: ₹1000 (unchanged)
   - Reward Balance: ₹50
   - Total Balance: ₹1050

4. User tries to withdraw ₹1000  
   - ❌ Failed (reward balance < ₹1000)
   - Error: "You can only withdraw from reward earnings"
