import mongoose from 'mongoose';
import { Zone } from './src/models/Zone.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const address = "Corporate House, 3, Chhoti Gwaltoli, Indore, Madhya Pradesh 452001, India";
  
  const activeZones = await Zone.find({ isActive: true }).lean();
  console.log("Active Zones:", activeZones.map(z => z.city));
  
  const matchedZone = activeZones.find(z => address.toLowerCase().includes(z.city.toLowerCase()));
  console.log("Matched Zone:", matchedZone ? matchedZone.name : "null");
  
  process.exit(0);
}
run();
