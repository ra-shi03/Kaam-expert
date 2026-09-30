import mongoose from 'mongoose';
import { Booking } from './src/models/Booking.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const b = await mongoose.connection.db.collection('bookings').findOne({ _id: new mongoose.Types.ObjectId('6abccbc89998c8497856fb9d') });
  console.log('eligibleLabourCount:', b.eligibleLabourCount);
  process.exit(0);
}
run().catch(console.error);
