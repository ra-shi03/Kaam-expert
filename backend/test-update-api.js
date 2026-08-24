import mongoose from 'mongoose';
import { User } from './src/models/User.js';

async function test() {
  await mongoose.connect('mongodb://localhost:27017/kaamexpert');
  
  let user = await User.findById("6a87e4559dc66dec7d46ad58");
  if (!user) {
    console.log("No user found");
    process.exit(1);
  }
  
  // Simulate controller logic
  user.labourProfile = user.labourProfile || {};
  user.labourProfile.experienceYears = 5;
  
  // Is it marked modified?
  console.log("Modified paths before save:", user.modifiedPaths());
  
  await user.save();
  
  // Fetch again
  let updatedUser = await User.findById(user._id);
  console.log("After:", updatedUser.labourProfile?.experienceYears);
  
  process.exit(0);
}

test().catch(console.error);
