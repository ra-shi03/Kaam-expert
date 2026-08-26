import mongoose from 'mongoose';
import { WalletTransaction } from './src/models/WalletTransaction.js';
import { Wallet } from './src/models/Wallet.js';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/kaam-expert');
  const refunds = await WalletTransaction.find({ context: 'REFUND' }).lean();
  console.log("REFUNDS:", refunds);
  const wallets = await Wallet.find({}).lean();
  console.log("WALLETS:", wallets);
  mongoose.disconnect();
}
run();
