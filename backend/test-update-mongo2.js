import mongoose from 'mongoose';
import { User } from './src/models/User.js';

async function run() {
  await mongoose.connect('mongodb+srv://rahulbairwa7610_db_user:E1CJKKdMkEQZHrjw@cluster0.4moncv5.mongodb.net/?appName=Cluster0');
  
  let user = await User.findOne({ role: 'labour' });
  if (!user) {
    console.log("No labour user found");
    process.exit(1);
  }

  // Simulate updateMe controller
  if (!user.labourProfile) user.labourProfile = {};
  user.set('labourProfile.experienceYears', 45);
  
  await user.save();
  
  let updatedUser = await User.findById(user._id);
  console.log("After manual save (in DB):", updatedUser.labourProfile.experienceYears);
  
  process.exit(0);
}
run();
