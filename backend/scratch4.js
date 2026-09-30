import mongoose from 'mongoose';
import { Booking } from './src/models/Booking.js';
import { getBroadcastTimeoutMs } from './src/services/broadcastService.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const bookings = await Booking.find({ _id: '6abcbad0a0f52d21c00aa9a6' }).select('_id type scheduledAt').lean();
  console.log('Bookings:', bookings);
  console.log('timeoutMs:', getBroadcastTimeoutMs(bookings[0]));
  process.exit(0);
}
run().catch(console.error);
