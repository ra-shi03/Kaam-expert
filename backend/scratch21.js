import mongoose from 'mongoose';
import { Booking } from './src/models/Booking.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find a valid original booking to clone
  const original = await Booking.findOne({ type: 'SCHEDULED', userId: { $exists: true } }).lean();
  if (!original) {
    console.log("No scheduled booking found to clone");
    process.exit(1);
  }
  delete original._id;
  delete original.createdAt;
  delete original.updatedAt;
  delete original.__v;
  
  // Schedule it for EXACTLY 60 minutes and 5 seconds from now so the cron picks it up immediately
  const now = new Date();
  const scheduledTime = new Date(now.getTime() + (60 * 60 * 1000) + 15000); 
  
  original.status = 'CREATED';
  original.scheduledAt = scheduledTime;
  original.timeSlot = `${String(scheduledTime.getHours()).padStart(2, '0')}:${String(scheduledTime.getMinutes()).padStart(2, '0')}`;
  
  const newBooking = await Booking.create(original);
  console.log("Created test scheduled booking:", newBooking._id);
  console.log("Scheduled time:", scheduledTime);
  
  let checks = 0;
  const interval = setInterval(async () => {
    checks++;
    const b2 = await Booking.findById(newBooking._id).lean();
    console.log(`[Check ${checks}] Status: ${b2.status}, eligibleLabourCount: ${b2.eligibleLabourCount}`);
    
    if (b2.status !== 'CREATED') {
      const logs = await mongoose.connection.db.collection('broadcastlogs').find({ bookingId: newBooking._id }).toArray();
      console.log('Logs count:', logs.length);
      clearInterval(interval);
      console.log("Final status:", b2.status);
      process.exit(0);
    }
    
    if (checks > 15) {
      clearInterval(interval);
      console.log("Timed out");
      process.exit(0);
    }
  }, 10000);
}
run().catch(console.error);
