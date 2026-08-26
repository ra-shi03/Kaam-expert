import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const Wallet = mongoose.model('Wallet', new mongoose.Schema({}, { strict: false }));
const UserSubscription = mongoose.model('UserSubscription', new mongoose.Schema({}, { strict: false }));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const users = await User.find({ firstName: /Mohit/i }).lean();
  console.log('MOHIT USERS:');
  for (let u of users) {
      console.log(u._id, u.firstName, u.lastName, u.role);
      const w = await Wallet.findOne({ userId: u._id }).lean();
      console.log('  WALLET:', w ? w._id : 'NONE');
  }

  const subs = await UserSubscription.find({ refundStatus: 'refunded' }).lean();
  console.log('\nREFUNDED SUBS:');
  for (let s of subs) {
      console.log('SUB ID:', s._id, 'LABOUR ID:', s.labour);
  }
  
  process.exit(0);
}
run();
