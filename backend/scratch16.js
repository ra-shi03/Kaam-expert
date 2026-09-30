import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const logs = await mongoose.connection.db.collection('broadcastlogs').find({ bookingId: new mongoose.Types.ObjectId('6abccc5f2fabf81839b52f4b') }).toArray();
  console.log('Logs:', logs.length);
  process.exit(0);
}
run().catch(console.error);
