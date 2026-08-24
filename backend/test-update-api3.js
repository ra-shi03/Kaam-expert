import axios from 'axios';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

async function run() {
  await mongoose.connect('mongodb+srv://rahulbairwa7610_db_user:E1CJKKdMkEQZHrjw@cluster0.4moncv5.mongodb.net/?appName=Cluster0');
  
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
      labourProfile: { experienceYears: 20 }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log("API Response Data:", JSON.stringify(res.data.data.user.labourProfile, null, 2));
  } catch (err) {
    console.log("API Error:");
    console.log(err.response?.data || err.message);
  }

  process.exit(0);
}
run();
