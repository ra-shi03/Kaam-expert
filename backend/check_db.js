import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    const usersCount = await db.collection('users').countDocuments();
    const bookingsCount = await db.collection('bookings').countDocuments();
    console.log('Total users:', usersCount);
    console.log('Total bookings:', bookingsCount);
    
    const sampleUser = await db.collection('users').findOne();
    console.log('Sample user role:', sampleUser?.role);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkDb();
