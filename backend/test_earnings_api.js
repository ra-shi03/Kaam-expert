import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as walletController from './src/controllers/walletController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find a wallet transaction with REFUND
  const tx = await mongoose.model('WalletTransaction').findOne({ context: 'REFUND' }).lean();
  if (!tx) {
    console.log("NO REFUND TX FOUND");
    process.exit(0);
  }
  
  const wallet = await mongoose.model('Wallet').findById(tx.walletId).lean();
  
  const req = { user: { _id: wallet.userId } };
  const res = {
    status: (code) => res,
    json: (body) => {
      console.log(JSON.stringify(body, null, 2));
      process.exit(0);
    }
  };
  
  await walletController.getEarningsSummary(req, res, () => {});
}
run();
