import mongoose from 'mongoose';
import { Booking } from './src/models/Booking.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Fake "now" to be EXACTLY 13:07 IST (07:37 Z)
  const now = new Date('2026-09-30T07:37:00.161Z');
  const sevenMinsAgo = new Date(now.getTime() - 7 * 60 * 1000)
  const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000)
  
  const stuck = await Booking.find({
    _id: '6abcbad0a0f52d21c00aa9a6',
    $or: [
      { type: { $ne: 'SCHEDULED' }, updatedAt: { $lt: sevenMinsAgo } },
      { type: 'SCHEDULED', scheduledAt: { $lt: fiveMinsAgo } },
    ],
  });
  console.log("Matched stuck:", stuck.length > 0);
  console.log("sevenMinsAgo:", sevenMinsAgo);
  console.log("fiveMinsAgo:", fiveMinsAgo);
  
  process.exit(0);
}
run().catch(console.error);
