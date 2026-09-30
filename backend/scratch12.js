import mongoose from 'mongoose';
import { Booking } from './src/models/Booking.js';
import { User } from './src/models/User.js';
import { LabourService } from './src/models/LabourService.js';
import { BroadcastLog } from './src/models/BroadcastLog.js';
import dotenv from 'dotenv';
dotenv.config();

function emitToUser(userId, eventName, payload) {
  // console.log("emitToUser called for", userId);
}

async function persistBroadcastLog(bookingId, laborId, payload) {
  console.log("persistBroadcastLog called for", laborId);
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const booking = await Booking.findById('6abcbad0a0f52d21c00aa9a6').populate('userId', 'fullName phone');
  const eligibleLaborers = await User.find({ role: { $in: ['labour', 'contractor'] } }).limit(2);
  const timeoutMs = 3720000;

  try {
    let serviceNameMap = {}
    let singleServiceName = 'Requested Service'

    if (booking.contractorInfo?.services?.length > 0) {
      const svcDocs = await LabourService.find({
        _id: { $in: booking.contractorInfo.services.map(s => s.serviceId) }
      }).select('_id name').lean()
      svcDocs.forEach(s => { serviceNameMap[String(s._id)] = s.name })
    } else {
      const service = await LabourService.findById(booking.serviceId).select('name').lean()
      if (service) singleServiceName = service.name
    }

    for (const labor of eligibleLaborers) {
      const laborServiceIds = labor.labourProfile?.serviceIds?.map(id => String(id)) || []
      const bookingHours = booking.duration || booking.hours || 1

      if (booking.contractorInfo?.services?.length > 0) {
        // ...
      } else {
        const singleShare = booking.laborShare || booking.basePrice || 0
        const offerPayload = {
          bookingId: booking._id,
          type: booking.type,
          customerName: booking.userId?.fullName || 'Customer',
          serviceName: singleServiceName,
          isContractorBooking: false,
          requiresServiceSelection: false,
          date: booking.scheduledAt || booking.createdAt,
          time: booking.timeSlot || 'Earliest available',
          duration: bookingHours,
          customerLocation: booking.address?.locationText || 'Service Location',
          address: { locationText: booking.address?.locationText || 'Service Location' },
          approximateDistance: labor.approximateDistance,
          estimatedEarnings: singleShare,
          laborShare: singleShare,
          timeoutMs
        }
        
        emitToUser(labor._id, 'BOOKING_RECEIVED', offerPayload)
        await persistBroadcastLog(booking._id, labor._id, offerPayload)
      }
    }
  } catch (emitErr) {
    console.error(`[BROADCAST] ❌ Error during socket emission for booking ${booking._id}:`, emitErr)
  }
  process.exit(0);
}
run().catch(console.error);
