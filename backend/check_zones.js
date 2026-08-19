import mongoose from 'mongoose';
import { Zone } from './src/models/Zone.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const zones = await Zone.find().lean();
  console.log(JSON.stringify(zones, null, 2));
  process.exit(0);
}
run();
