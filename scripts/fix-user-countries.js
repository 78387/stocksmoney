// Script to fix existing users' country information
const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  country: {
    code: String,
    name: String,
    currency: String,
    symbol: String
  },
  ipAddress: String,
  password: String,
  balance: Number,
  status: String,
  isOnline: Boolean,
  lastLogin: Date
}, {
  timestamps: true
});

const User = mongoose.model('User', UserSchema);

async function fixUserCountries() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://vishalsingh25269:Vishal12@cluster0.rvdbmqf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to check`);

    let updatedCount = 0;

    for (const user of users) {
      let needsUpdate = false;
      let updateData = {};

      // Check if user has country information
      if (!user.country || !user.country.code) {
        // Set default to India if no country info
        updateData.country = {
          code: 'IN',
          name: 'India',
          currency: 'INR',
          symbol: '₹'
        };
        needsUpdate = true;
        console.log(`Setting default country for user: ${user.email}`);
      } else {
        // Check if country data is complete
        if (!user.country.name || !user.country.currency || !user.country.symbol) {
          if (user.country.code === 'GB') {
            updateData.country = {
              code: 'GB',
              name: 'United Kingdom',
              currency: 'GBP',
              symbol: '£'
            };
          } else {
            updateData.country = {
              code: 'IN',
              name: 'India',
              currency: 'INR',
              symbol: '₹'
            };
          }
          needsUpdate = true;
          console.log(`Fixing incomplete country data for user: ${user.email}`);
        }
      }

      // For testing: If you want to manually set some users to UK
      // Uncomment and modify the condition below
      // if (user.email.includes('uk') || user.email.includes('gb')) {
      //   updateData.country = {
      //     code: 'GB',
      //     name: 'United Kingdom',
      //     currency: 'GBP',
      //     symbol: '£'
      //   };
      //   needsUpdate = true;
      //   console.log(`Setting UK country for user: ${user.email}`);
      // }

      if (needsUpdate) {
        await User.findByIdAndUpdate(user._id, updateData);
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} users`);

    // Show summary of countries
    const countrySummary = await User.aggregate([
      {
        $group: {
          _id: '$country.code',
          count: { $sum: 1 },
          countryName: { $first: '$country.name' }
        }
      }
    ]);

    console.log('\nCountry Summary:');
    countrySummary.forEach(country => {
      console.log(`${country.countryName || country._id}: ${country.count} users`);
    });

  } catch (error) {
    console.error('Error fixing user countries:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
fixUserCountries();
