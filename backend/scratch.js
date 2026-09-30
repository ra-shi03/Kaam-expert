import mongoose from 'mongoose';
import { Booking } from './src/models/Booking.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const recentBookings = await Booking.find({ type: 'SCHEDULED' }).sort({ createdAt: -1 }).limit(5).lean();
  console.log("Recent Scheduled Bookings:");
  for (const b of recentBookings) {
    console.log(`ID: ${b._id}, status: ${b.status}, scheduledAt: ${b.scheduledAt}, timeSlot: ${b.timeSlot}`);
    if (b.status === 'FAILED') {
      const logs = await mongoose.connection.db.collection('broadcastlogs').find({ bookingId: b._id }).toArray();
      console.log(`  -> Broadcast Logs: ${logs.length}`);
    }
  }
  process.exit(0);
}
run().catch(console.error);
