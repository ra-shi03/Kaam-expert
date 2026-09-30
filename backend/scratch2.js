import mongoose from 'mongoose';
import { Booking } from './src/models/Booking.js';
import { getBroadcastTimeoutMs } from './src/services/broadcastService.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const booking = await Booking.findById('6abcbad0a0f52d21c00aa9a6');
  console.log('booking type:', booking.type);
  console.log('booking scheduledAt:', booking.scheduledAt);
  const timeoutMs = getBroadcastTimeoutMs(booking);
  console.log('Calculated timeoutMs:', timeoutMs);
  process.exit(0);
}
run().catch(console.error);
