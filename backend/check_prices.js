import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import { LabourService } from './src/models/LabourService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '.env') })

async function check() {
  await mongoose.connect(process.env.MONGODB_URI)
  const services = await LabourService.find({}).lean()
  console.log("SERVICES:")
  services.forEach(s => {
    console.log(s.name, "- basePrice:", s.basePrice, "- hourlyPrice:", s.hourlyPrice, "- zones:", JSON.stringify(s.zones))
  })
  process.exit(0)
}
check()
