import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Invoice } from './src/models/Invoice.js';
import { User } from './src/models/User.js';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  
  const corporates = await User.find({ role: 'corporate' });
  for (const corp of corporates) {
    const count = await Invoice.countDocuments({ corporateId: corp._id });
    console.log(`Corporate ${corp.email} has ${count} invoices`);
  }
  process.exit(0);
}

check();
