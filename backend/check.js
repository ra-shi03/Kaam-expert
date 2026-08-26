import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const WalletTransaction = mongoose.model('WalletTransaction', new mongoose.Schema({}, { strict: false }));
const Wallet = mongoose.model('Wallet', new mongoose.Schema({}, { strict: false }));
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const txs = await WalletTransaction.find({ context: 'REFUND' }).lean();
  console.log('REFUND TRANSACTIONS:', txs);
  
  for(let tx of txs) {
      const wallet = await Wallet.findById(tx.walletId).lean();
      console.log('WALLET:', wallet);
      const user = await User.findById(wallet.userId).lean();
      console.log('USER:', user ? user.firstName : 'NOT FOUND');
  }
  process.exit(0);
}
run();
