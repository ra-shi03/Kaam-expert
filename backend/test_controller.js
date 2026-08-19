import mongoose from 'mongoose';
import { Zone } from './src/models/Zone.js';
import { LabourService } from './src/models/LabourService.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const city = "Indore";
  const address = "Corporate House, 3, Chhoti Gwaltoli, Indore, Madhya Pradesh 452001, India";
  
  let userZoneId = null;

  if (city) {
    const zone = await Zone.findOne({
      isActive: true,
      city: { $regex: new RegExp(`^${city}$`, 'i') }
    }).lean()
    if (zone) {
      userZoneId = String(zone._id)
      console.log("Matched by city:", userZoneId);
    }
  }
  
  if (!userZoneId && address) {
    const activeZones = await Zone.find({ isActive: true }).lean()
    const matchedZone = activeZones.find(z => address.toLowerCase().includes(z.city.toLowerCase()))
    if (matchedZone) {
      userZoneId = String(matchedZone._id)
      console.log("Matched by address fallback:", userZoneId);
    }
  }

  const s = await LabourService.findOne({ name: "Shower Installation" }).lean();
  console.log("Original hourlyPrice:", s.hourlyPrice);
  
  if (userZoneId && s.zones && s.zones.length > 0) {
    console.log("s.zones is:", JSON.stringify(s.zones, null, 2));
    console.log("Looking for userZoneId:", userZoneId);
    
    const zonePricing = s.zones.find(z => String(z.zone) === userZoneId)
    if (zonePricing) {
      console.log("Found zonePricing:", zonePricing);
      if (typeof zonePricing.price === 'number') {
        s.hourlyPrice = zonePricing.price;
        console.log("Updated hourlyPrice to:", s.hourlyPrice);
      } else {
        console.log("price is not a number:", typeof zonePricing.price);
      }
    } else {
      console.log("No zonePricing found!");
      // Let's debug what String(z.zone) is
      s.zones.forEach(z => {
        console.log(`String(z.zone)='${String(z.zone)}', type='${typeof z.zone}'`);
      });
    }
  } else {
    console.log("userZoneId or s.zones is missing");
  }
  
  process.exit(0);
}
run();
