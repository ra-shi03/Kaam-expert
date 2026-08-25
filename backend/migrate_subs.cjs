const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const uri = process.env.MONGODB_URI;

async function migrate() {
  if (!uri) {
    console.error('No MONGODB_URI found');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  // Update records to have durationDays and endDate
  const updateResult = await db.collection('usersubscriptions').updateMany(
    { endDate: { $exists: false } },
    [{
      $set: {
        durationDays: 1,
        endDate: "$date"
      }
    }]
  );
  console.log(`Updated ${updateResult.modifiedCount} records with endDate and durationDays`);

  // Expire past active subscriptions
  const expireResult = await db.collection('usersubscriptions').updateMany(
    { status: 'active', endDate: { $lt: today } },
    { $set: { status: 'expired' } }
  );
  console.log(`Expired ${expireResult.modifiedCount} old subscriptions`);

  process.exit(0);
}

migrate();
