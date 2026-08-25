import { Booking } from '../models/Booking.js'
import { User } from '../models/User.js'
import { Complaint } from '../models/Complaint.js'
import { PaymentTransaction } from '../models/PaymentTransaction.js'
import { UserSubscription } from '../models/UserSubscription.js'
import { USER_ROLES } from '../constants/roles.js'

export const getDashboardStats = async (req, res) => {
  try {
    // 1. User Stats
    const totalCustomers = await User.countDocuments({ role: USER_ROLES.CUSTOMER })
    const totalLabour = await User.countDocuments({ role: USER_ROLES.LABOUR })
    const totalContractor = await User.countDocuments({ role: USER_ROLES.CONTRACTOR })
    const totalAdmins = await User.countDocuments({ role: USER_ROLES.ADMIN })
    const totalUsers = totalCustomers + totalLabour + totalContractor + totalAdmins

    // 2. Booking Stats
    const totalBookings = await Booking.countDocuments()
    const pendingBookings = await Booking.countDocuments({ status: 'PENDING' })
    const acceptedBookings = await Booking.countDocuments({ status: 'ACCEPTED' })
    const completedBookings = await Booking.countDocuments({ status: 'COMPLETED' })
    const cancelledBookings = await Booking.countDocuments({ status: 'CANCELLED' })

    // 3. Complaint Stats
    const totalComplaints = await Complaint.countDocuments()
    const openComplaints = await Complaint.countDocuments({ status: 'OPEN' })
    
    // 4. Financial Stats
    // 4. Financial Stats
    
    // a. All Paid Bookings (includes cash and online, covers platform fee & GST as they are part of totalAmount)
    const paidBookings = await Booking.aggregate([
      { $match: { paymentStatus: 'PAID', status: 'COMPLETED' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ])
    const bookingRevenue = paidBookings.length > 0 ? paidBookings[0].totalRevenue : 0

    // b. Other Online Payments (Exclude BOOKING and SUBSCRIPTION to avoid duplicates)
    const extraPayments = await PaymentTransaction.aggregate([
      { $match: { status: 'CAPTURED', purpose: { $nin: ['BOOKING', 'SUBSCRIPTION'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ])
    const extraRevenue = extraPayments.length > 0 ? extraPayments[0].totalRevenue : 0

    // c. Labour Subscriptions (all plans)
    const labourSubscriptions = await UserSubscription.aggregate([
      { $match: { labour: { $exists: true }, status: { $in: ['active', 'expired'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$amountPaid' } } }
    ])
    const subscriptionRevenue = labourSubscriptions.length > 0 ? labourSubscriptions[0].totalRevenue : 0

    const totalRevenue = bookingRevenue + extraRevenue + subscriptionRevenue

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          customer: totalCustomers,
          labour: totalLabour,
          contractor: totalContractor,
          admin: totalAdmins
        },
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          accepted: acceptedBookings,
          completed: completedBookings,
          cancelled: cancelledBookings
        },
        complaints: {
          total: totalComplaints,
          open: openComplaints
        },
        finance: {
          totalRevenue
        }
      }
    })
  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    res.status(500).json({ success: false, message: 'Server Error while fetching stats' })
  }
}

export const getReportsData = async (req, res) => {
  try {
    const { type = 'users', startDate, endDate, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build match criteria for dates
    const dateMatch = {};
    if (startDate && endDate) {
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      dateMatch.createdAt = {
        $gte: new Date(startDate),
        $lte: endD
      };
    } else if (startDate) {
      dateMatch.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      dateMatch.createdAt = { $lte: endD };
    }

    let rows = [];
    let totalCount = 0;
    let chartData = [];

    if (type === 'users') {
      rows = await User.find(dateMatch).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean();
      totalCount = await User.countDocuments(dateMatch);

      chartData = await User.aggregate([
        { $match: dateMatch },
        { 
          $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", value: "$count" } }
      ]);
    } else if (type === 'bookings') {
      rows = await Booking.find(dateMatch)
        .populate('userId', 'phone role')
        .populate('laborId', 'phone role')
        .sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean();
      totalCount = await Booking.countDocuments(dateMatch);

      chartData = await Booking.aggregate([
        { $match: dateMatch },
        { 
          $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", value: "$count" } }
      ]);
    } else if (type === 'revenue') {
      const revMatch = { ...dateMatch, purpose: { $ne: 'SUBSCRIPTION' } };
      rows = await PaymentTransaction.find(revMatch)
        .populate('userId', 'phone role')
        .sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean();
      totalCount = await PaymentTransaction.countDocuments(revMatch);

      const ptChartData = await PaymentTransaction.aggregate([
        { $match: { ...dateMatch, status: 'CAPTURED', purpose: { $nin: ['BOOKING', 'SUBSCRIPTION'] } } },
        { 
          $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            totalAmount: { $sum: "$amount" } 
          } 
        }
      ]);

      const subChartData = await UserSubscription.aggregate([
        { $match: { ...dateMatch, labour: { $exists: true }, status: { $in: ['active', 'expired'] } } },
        { 
          $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            totalAmount: { $sum: "$amountPaid" } 
          } 
        }
      ]);

      const bookingChartData = await Booking.aggregate([
        { $match: { ...dateMatch, paymentStatus: 'PAID', status: 'COMPLETED' } },
        { 
          $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            totalAmount: { $sum: "$totalAmount" } 
          } 
        }
      ]);

      const mergedChart = {};
      ptChartData.forEach(d => mergedChart[d._id] = (mergedChart[d._id] || 0) + d.totalAmount);
      subChartData.forEach(d => mergedChart[d._id] = (mergedChart[d._id] || 0) + d.totalAmount);
      bookingChartData.forEach(d => mergedChart[d._id] = (mergedChart[d._id] || 0) + d.totalAmount);

      chartData = Object.keys(mergedChart).map(date => ({
        date,
        value: mergedChart[date]
      })).sort((a, b) => a.date.localeCompare(b.date));
    }

    res.status(200).json({
      success: true,
      data: {
        rows,
        chartData,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: limitNum,
          pages: Math.ceil(totalCount / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Error in getReportsData:', error);
    res.status(500).json({ success: false, message: 'Server Error while fetching report data' });
  }
}
