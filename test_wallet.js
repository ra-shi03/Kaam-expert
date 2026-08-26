import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const walletTransactionSchema = new mongoose.Schema({}, { strict: false });
const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const txs = await WalletTransaction.find({ context: 'REFUND' }).lean();
  console.log('REFUND TRANSACTIONS:', JSON.stringify(txs, null, 2));
  process.exit(0);
}
run();
