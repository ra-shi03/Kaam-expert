import mongoose from 'mongoose';
import { Booking } from './src/models/Booking.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kaamexpert');
  const allBookings = await Booking.find({});
  const deletedBookings = await Booking.find({ isDeleted: true });
  console.log(`Total Bookings: ${allBookings.length}`);
  console.log(`Deleted Bookings: ${deletedBookings.length}`);
  console.log(`Completed Bookings: ${allBookings.filter(b => b.status === 'COMPLETED').length}`);
  process.exit(0);
}
run();
