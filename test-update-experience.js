const mongoose = require('mongoose');
const { User } = require('./backend/src/models/User.js');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/kaamexpert');
  
  // Find a labour user
  let user = await User.findOne({ role: 'labour' });
  if (!user) {
    console.log("No labour user found");
    process.exit(1);
  }
  
  console.log("Before:", user.labourProfile?.experienceYears);
  
  // Simulate controller logic
  user.labourProfile = user.labourProfile || {};
  user.labourProfile.experienceYears = 5;
  await user.save();
  
  // Fetch again
  let updatedUser = await User.findById(user._id);
  console.log("After:", updatedUser.labourProfile?.experienceYears);
  
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
