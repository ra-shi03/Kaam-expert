import axios from 'axios';
import mongoose from 'mongoose';
import { User } from './backend/src/models/User.js';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/kaamexpert');
  
  // Find a labour user
  let user = await User.findOne({ role: 'labour' });
  if (!user) {
    console.log("No labour user found");
    process.exit(1);
  }
  
  // Set initial experience to something else
  user.labourProfile.experienceYears = 1;
  await user.save();
  
  console.log("Before (in DB):", user.labourProfile.experienceYears);

  // Directly call the controller logic on this user to test it!
  const req = {
    body: {
      labourProfile: { experienceYears: 10 }
    },
    user: user
  };
  
  const res = {
    status: (code) => ({
      json: (data) => console.log("Response:", JSON.stringify(data, null, 2))
    })
  };

  // We can't easily mock the whole express request for the controller.
  // Let's just simulate the assignment part again.
  user.labourProfile = user.labourProfile || {};
  user.labourProfile.experienceYears = req.body.labourProfile.experienceYears;
  user.markModified('labourProfile'); // What we added
  
  await user.save();
  
  let updatedUser = await User.findById(user._id);
  console.log("After (in DB):", updatedUser.labourProfile.experienceYears);
  
  process.exit(0);
}

run();
