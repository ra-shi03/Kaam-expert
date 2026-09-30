import mongoose from 'mongoose';
import { Booking } from './src/models/Booking.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const original = await Booking.findById('6abccbc89998c8497856fb9d').lean();
  delete original._id;
  delete original.createdAt;
  delete original.updatedAt;
  delete original.__v;
  
  // Schedule it for exactly 61 minutes from now
  const now = new Date();
  const scheduledTime = new Date(now.getTime() + 61 * 60 * 1000);
  
  original.status = 'CREATED';
  original.scheduledAt = scheduledTime;
  
  const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  original.timeSlot = formatter.format(scheduledTime);
  
  const newBooking = await Booking.create(original);
  console.log("Created test scheduled booking:", newBooking._id);
  
  process.exit(0);
}
run().catch(console.error);
