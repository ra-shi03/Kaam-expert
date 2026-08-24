import axios from 'axios';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/kaamexpert');
  
  // Need to import User model with mongoose already connected? No, can just use raw mongoose
  const userSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.model('User', userSchema);
  
  let user = await User.findOne({ role: 'labour' });
  if (!user) {
    console.log("No labour user found");
    process.exit(1);
  }

  const token = jwt.sign({ id: user._id }, 'kjadsf8a96dsf6a9dd', { expiresIn: '1d' });
  
  try {
    const res = await axios.patch('http://localhost:5005/api/v1/users/me', {
      labourProfile: { experienceYears: 12 }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log("API Response:");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log("API Error:");
    console.log(err.response?.data || err.message);
  }

  process.exit(0);
}
run();
