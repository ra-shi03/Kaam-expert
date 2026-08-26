import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const WalletTransaction = mongoose.model('WalletTransaction', new mongoose.Schema({}, { strict: false }));
const Wallet = mongoose.model('Wallet', new mongoose.Schema({}, { strict: false }));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // The labour's user ID
  const labourId = new mongoose.Types.ObjectId('6a82f695e93efee7fd1e332a');
  
  // Find or create labour's wallet
  let labourWallet = await Wallet.findOne({ userId: labourId });
  if (!labourWallet) {
      const w = await Wallet.create({ userId: labourId, selfBalance: 0, adminBalance: 0, isActive: true });
      labourWallet = await Wallet.findOne({ userId: labourId });
  }

  // The wrong transaction
  const tx = await WalletTransaction.findOne({ _id: new mongoose.Types.ObjectId('6a8e7ede5196e3909e431196') });
  
  if (tx) {
      console.log('Updating tx walletId from', tx.walletId, 'to', labourWallet._id);
      await WalletTransaction.updateOne({ _id: tx._id }, { $set: { walletId: labourWallet._id } });
  }
  
  // Add 19 to selfBalance if not already added
  console.log('Updating labour wallet balance');
  await Wallet.updateOne({ _id: labourWallet._id }, { $inc: { selfBalance: 19 } });
  
  console.log('Done.');
  process.exit(0);
}
run();
