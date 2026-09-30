import mongoose from 'mongoose'
import dns from 'dns'

// Some local routers only proxy DNS over UDP and refuse the TCP retry that
// mongodb+srv:// SRV lookups can trigger (ECONNREFUSED on querySrv). Point
// Node's resolver at a public DNS server that supports both.
dns.setServers(['8.8.8.8', '1.1.1.1'])

export async function connectDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  return mongoose.connection
}
