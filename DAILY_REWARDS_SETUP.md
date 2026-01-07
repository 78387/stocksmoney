# Daily Rewards System Setup

## 🎯 What's Implemented

### Daily Reward System:
- **20% daily reward** on active orders
- **Automatic processing at 12:00 AM** every day
- **Rewards go to user's reward balance** (withdrawable)
- **Only active orders** get rewards (not expired ones)

## 🚀 Setup Instructions

### 1. Start your server
```bash
npm run dev
```

### 2. Initialize balance fields (if not done already)
```bash
curl -X POST http://localhost:3001/api/initialize-balances
```

### 3. Start the daily reward scheduler
```bash
curl -X POST http://localhost:3001/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

### 4. Test the system manually (Admin only)
```bash
# Login as admin first, then use admin token
curl -X POST http://localhost:3001/api/admin/trigger-rewards \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📋 How It Works

### Daily Reward Process:
1. **Every day at 12:00 AM**, scheduler checks for active orders
2. **For each active order** that hasn't received reward today:
   - Calculate 20% of product price
   - Add to user's `rewardBalance` and `balance`
   - Create reward transaction
   - Update order's `lastRewardDate`
3. **Expired orders** are automatically marked as expired

### Example:
- User buys product worth ₹1000
- Daily reward = ₹1000 × 20% = ₹200
- Every day at 12 AM, ₹200 goes to user's reward balance
- User can withdraw this reward money

## 🔧 API Endpoints

### Scheduler Control:
```bash
# Start scheduler
POST /api/scheduler {"action": "start"}

# Stop scheduler  
POST /api/scheduler {"action": "stop"}

# Check status
GET /api/scheduler
```

### Manual Triggers (Admin only):
```bash
# Trigger rewards manually
POST /api/admin/trigger-rewards

# Check reward status
GET /api/cron/daily-rewards
```

## 📊 Monitoring

### Check if scheduler is running:
```bash
curl http://localhost:3001/api/scheduler
```

### Check today's reward statistics:
```bash
curl http://localhost:3001/api/cron/daily-rewards
```

## 🛠 Troubleshooting

### If rewards are not processing:
1. **Check scheduler status**: `GET /api/scheduler`
2. **Check server logs** for any errors
3. **Verify active orders exist** in database
4. **Manual trigger** to test: `POST /api/admin/trigger-rewards`

### If scheduler stops:
1. **Restart scheduler**: `POST /api/scheduler {"action": "start"}`
2. **Check server restart** - scheduler stops on server restart
3. **Check for errors** in server logs

## 📱 User Experience

### For Users:
1. **Buy a product** → Order becomes active
2. **Every day at 12 AM** → Get 20% reward automatically
3. **Check wallet** → Reward balance increases
4. **Withdraw rewards** → Only reward balance can be withdrawn

### For Admins:
1. **Monitor rewards** via admin dashboard
2. **Manual trigger** if needed
3. **Check statistics** and logs

## ⚠️ Important Notes

1. **Scheduler runs in memory** - stops on server restart
2. **Auto-restart scheduler** after server restart
3. **Only active orders** get rewards
4. **One reward per day** per order
5. **Rewards go to reward balance** (withdrawable)
6. **20% of product price** as daily reward

## 🔄 Production Setup

For production, consider:
1. **External cron job** instead of in-memory scheduler
2. **Database-based job queue** for reliability
3. **Monitoring and alerting** for failed rewards
4. **Backup reward processing** mechanism
