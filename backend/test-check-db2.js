import mongoose from 'mongoose';
import { User } from './src/models/User.js';

async function run() {
  await mongoose.connect('mongodb+srv://rahulbairwa7610_db_user:E1CJKKdMkEQZHrjw@cluster0.4moncv5.mongodb.net/?appName=Cluster0');
  let user = await User.findById('6a87e4559dc66dec7d46ad58');
  console.log("DB User:", JSON.stringify(user.labourProfile, null, 2));
  process.exit(0);
}
run();
