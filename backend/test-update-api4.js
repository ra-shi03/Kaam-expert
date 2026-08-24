import axios from 'axios';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from './src/models/User.js';

async function run() {
  await mongoose.connect('mongodb+srv://rahulbairwa7610_db_user:E1CJKKdMkEQZHrjw@cluster0.4moncv5.mongodb.net/?appName=Cluster0');
  
  let user = await User.findById('6a87e4559dc66dec7d46ad58');
  if (!user) {
    console.log("User not found");
    process.exit(1);
  }

  const token = jwt.sign({ sub: user._id }, 'kjadsf8a96dsf6a9dd', { expiresIn: '1d' });
  
  try {
    const res = await axios.patch('http://localhost:5005/api/v1/users/me', {
      labourProfile: { experienceYears: 55 }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log("API Response Data:", JSON.stringify(res.data.data.user.labourProfile, null, 2));
    
    // Check DB directly
    let updatedUser = await User.findById(user._id);
    console.log("DB User experienceYears:", updatedUser.labourProfile?.experienceYears);
    
  } catch (err) {
    console.log("API Error:");
    console.log(err.response?.data || err.message);
  }

  process.exit(0);
}
run();
