import mongoose from 'mongoose';
import { Booking } from './src/models/Booking.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Clone the last failed booking to create a new one
  const original = await Booking.findById('6abcbad0a0f52d21c00aa9a6').lean();
  delete original._id;
  delete original.createdAt;
  delete original.updatedAt;
  delete original.__v;
  
  // Schedule it for exactly 61 minutes from now
  const now = new Date();
  const scheduledTime = new Date(now.getTime() + 61 * 60 * 1000);
  
  original.status = 'CREATED';
  original.scheduledAt = scheduledTime;
  
  // Format timeSlot for the scheduledTime
  const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  original.timeSlot = formatter.format(scheduledTime);
  
  const newBooking = await Booking.create(original);
  console.log("Created test scheduled booking:", newBooking._id);
  console.log("Scheduled At:", newBooking.scheduledAt);
  console.log("TimeSlot:", newBooking.timeSlot);
  
  process.exit(0);
}
run().catch(console.error);
