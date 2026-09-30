import mongoose from 'mongoose';
import { Booking } from './src/models/Booking.js';
import { BroadcastLog } from './src/models/BroadcastLog.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log("Monitoring booking 6abccbc89998c8497856fb9d...");
  let checks = 0;
  
  const interval = setInterval(async () => {
    checks++;
    const b = await Booking.findById('6abccbc89998c8497856fb9d').lean();
    const logs = await BroadcastLog.find({ bookingId: '6abccbc89998c8497856fb9d' }).lean();
    
    console.log(`[Check ${checks}] Status: ${b.status}, Logs count: ${logs.length}`);
    if (logs.length > 0) {
      console.log("Logs found!", JSON.stringify(logs, null, 2));
    }
    
    if (b.status !== 'CREATED' || checks > 15) {
      clearInterval(interval);
      console.log("Final status:", b.status);
      process.exit(0);
    }
  }, 10000);
}
run().catch(console.error);
