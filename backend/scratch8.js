import mongoose from 'mongoose';
import { Booking } from './src/models/Booking.js';
import { User } from './src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const booking = await Booking.findById('6abcbad0a0f52d21c00aa9a6').populate('userId');
  const eligibleLaborers = await User.find({ role: { $in: ['labour', 'contractor'] } }).limit(2);
  
  for (const labor of eligibleLaborers) {
    const singleShare = booking.laborShare || booking.basePrice || 0
    const offerPayload = {
      bookingId: booking._id,
      type: booking.type,
      customerName: booking.userId?.fullName || 'Customer',
      serviceName: 'Test Service',
      isContractorBooking: false,
      requiresServiceSelection: false,
      date: booking.scheduledAt || booking.createdAt,
      time: booking.timeSlot || 'Earliest available',
      duration: booking.duration || booking.hours || 1,
      customerLocation: booking.address?.locationText || 'Service Location',
      address: { locationText: booking.address?.locationText || 'Service Location' },
      approximateDistance: 5,
      estimatedEarnings: singleShare,
      laborShare: singleShare,
      timeoutMs: 3720000
    }
    console.log("Payload:", offerPayload);
  }
  process.exit(0);
}
run().catch(console.error);
