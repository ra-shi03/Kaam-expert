import mongoose from 'mongoose';
import { Zone } from './backend/src/models/Zone.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const zones = await Zone.find().lean();
  console.log(JSON.stringify(zones, null, 2));
  process.exit(0);
}
run();
