const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  country: {
    code: String,
    name: String,
    currency: String,
    symbol: String
  },
  ipAddress: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function fixUKUsers() {
  try {
    await mongoose.connect('mongodb+srv://vishalsingh25269:Vishal12@cluster0.rvdbmqf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let updatedCount = 0;

    for (const user of users) {
      let shouldUpdateToUK = false;

      // Check if user should be UK based on email or IP
      if (user.email && (user.email.includes('uk') || user.email.includes('gb') || user.email.includes('.uk'))) {
        shouldUpdateToUK = true;
        console.log(`Setting UK for email: ${user.email}`);
      }
      
      // You can also check by IP if you know UK IP ranges
      // if (user.ipAddress && user.ipAddress.startsWith('UK_IP_PREFIX')) {
      //   shouldUpdateToUK = true;
      // }

      if (shouldUpdateToUK) {
        await User.findByIdAndUpdate(user._id, {
          country: {
            code: 'GB',
            name: 'United Kingdom',
            currency: 'GBP',
            symbol: '£'
          }
        });
        updatedCount++;
        console.log(`Updated ${user.email} to UK`);
      }
    }

    console.log(`Updated ${updatedCount} users to UK`);

    // Show final summary
    const summary = await User.aggregate([
      {
        $group: {
          _id: '$country.code',
          count: { $sum: 1 },
          countryName: { $first: '$country.name' }
        }
      }
    ]);

    console.log('\nFinal Country Summary:');
    summary.forEach(country => {
      console.log(`${country.countryName || country._id}: ${country.count} users`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixUKUsers();
