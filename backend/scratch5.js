import mongoose from 'mongoose';
import { BroadcastLog } from './src/models/BroadcastLog.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    await BroadcastLog.findOneAndUpdate(
      { bookingId: '6abcbad0a0f52d21c00aa9a6', laborId: '6aba29efe1fc743182a6f242' },
      {
        $set: {
          status: 'PENDING',
          broadcastedAt: new Date(),
          payload: { test: 1 },
          respondedAt: null,
        },
      },
      { upsert: true }
    );
    console.log("Success!");
  } catch (err) {
    console.log("Error:", err);
  }
  process.exit(0);
}
run().catch(console.error);
