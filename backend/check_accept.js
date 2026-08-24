import mongoose from 'mongoose'
import { Booking } from './src/models/Booking.js'
import dotenv from 'dotenv'
dotenv.config()
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected'))
  .catch(err => console.error(err))
