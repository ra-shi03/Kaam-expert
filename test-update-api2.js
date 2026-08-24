import axios from 'axios';
import mongoose from 'mongoose';
import { User } from './backend/src/models/User.js';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/kaamexpert');
  let user = await User.findOne({ role: 'labour' });
  if (!user) {
    console.log("No labour user found");
    process.exit(1);
  }

  // Generate a JWT to authenticate
  import jwt from 'jsonwebtoken';
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback-secret-here', { expiresIn: '1d' });
  // wait, what is the JWT_SECRET? I can get it from backend/.env
  
  process.exit(0);
}
run();
