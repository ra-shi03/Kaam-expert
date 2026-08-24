import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { SubscriptionPlan } from './src/models/SubscriptionPlan.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

async function run() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  await SubscriptionPlan.deleteMany({})
  console.log('Cleared existing plans')

  const defaultPlans = [
    { name: '1 Week', durationDays: 7, price: 99, features: ['Access to all daily jobs', 'Priority support'], isActive: true },
    { name: '15 Days', durationDays: 15, price: 199, features: ['Access to all daily jobs', 'Priority support', 'Featured profile'], isActive: true },
    { name: '1 Month', durationDays: 30, price: 299, features: ['Access to all daily jobs', 'Priority support', 'Featured profile', 'Zero commission on first 5 jobs'], isActive: true }
  ]
  await SubscriptionPlan.insertMany(defaultPlans)
  console.log('Seeded exact 3 plans')

  process.exit(0)
}

run()
