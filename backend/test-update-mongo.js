import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb+srv://rahulbairwa7610_db_user:E1CJKKdMkEQZHrjw@cluster0.4moncv5.mongodb.net/?appName=Cluster0');
  const userSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.model('User', userSchema);
  let user = await User.findOne({ role: 'labour' });
  if (!user) {
    console.log("No labour user found");
    process.exit(1);
  }

  console.log("Before (in DB):", user.get('labourProfile.experienceYears'));
  
  await User.updateOne({ _id: user._id }, { $set: { 'labourProfile.experienceYears': 42 } });
  
  let updatedUser = await User.findById(user._id);
  console.log("After manual update (in DB):", updatedUser.get('labourProfile.experienceYears'));
  
  process.exit(0);
}
run();
