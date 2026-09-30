import mongoose from 'mongoose';
import { startBroadcastCycle } from './src/services/broadcastService.js';
import { Booking } from './src/models/Booking.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB.");
  try {
    await Booking.updateOne({ _id: '6abcbad0a0f52d21c00aa9a6' }, { $set: { status: 'CREATED' } });
    await startBroadcastCycle('6abcbad0a0f52d21c00aa9a6');
    console.log("Finished running startBroadcastCycle.");
  } catch (err) {
    console.log("Uncaught error:", err);
  }
  process.exit(0);
}
run().catch(console.error);
