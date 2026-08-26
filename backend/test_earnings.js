import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const walletTransactionSchema = new mongoose.Schema({}, { strict: false });
const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
const Wallet = mongoose.model('Wallet', new mongoose.Schema({}, { strict: false }));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const wallet = await Wallet.findOne({ userId: '6a82f695e93efee7fd1e332a' }); // Using the socket ID from previous terminal logs
  
  if(wallet) {
    const txs = await WalletTransaction.find({
        walletId: wallet._id,
        type: 'CREDIT',
        context: 'REFUND'
    }).lean();
    console.log(txs);
  } else {
    console.log("No wallet");
  }
  process.exit(0);
}
run();
