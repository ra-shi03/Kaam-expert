import mongoose from 'mongoose';
import { Booking } from './src/models/Booking.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find the latest test booking created in the last minute
  const b = await Booking.findOne({ type: 'SCHEDULED' }).sort({ createdAt: -1 }).lean();
  console.log("Monitoring booking:", b._id);
  
  let checks = 0;
  
  const interval = setInterval(async () => {
    checks++;
    const b2 = await Booking.findById(b._id).lean();
    console.log(`[Check ${checks}] Status: ${b2.status}`);
    
    if (b2.status !== 'CREATED' || checks > 15) {
      clearInterval(interval);
      console.log("Final status:", b2.status);
      process.exit(0);
    }
  }, 10000);
}
run().catch(console.error);
