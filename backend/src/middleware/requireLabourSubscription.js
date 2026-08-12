import { SystemSetting } from '../models/SystemSetting.js'
import { UserSubscription } from '../models/UserSubscription.js'
import { HTTP_STATUS, sendError } from '../utils/apiResponse.js'
import { USER_ROLES, KYC_STATUS } from '../constants/roles.js'

export const requireLabourSubscription = async (req, res, next) => {
  if (req.user.role !== USER_ROLES.LABOUR) {
    return next() // Only applies to labours
  }

  // 1. Must be verified
  if (req.user.labourProfile?.kycStatus !== KYC_STATUS.VERIFIED) {
    return sendError(res, {
      message: 'Your account must be verified by admin first',
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: 'UNVERIFIED',
    })
  }

  const settings = await SystemSetting.findOne({ configKey: 'master_config' })
  const startHour = settings?.subscriptionStartHour || 8
  const endHour = settings?.subscriptionEndHour || 20

  const now = new Date()
  const currentHour = now.getHours()

  // 2. Check operational window
  if (currentHour < startHour || currentHour >= endHour) {
    return sendError(res, {
      message: `The platform is only operational between ${startHour}:00 and ${endHour}:00`,
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: 'OUTSIDE_OPERATIONAL_HOURS',
    })
  }

  // 3. Check Free Trial
  const trialEnds = req.user.labourProfile?.trialEndsAt
  if (trialEnds && now <= new Date(trialEnds)) {
    return next() // Trial is active
  }

  // 4. Check Daily Subscription
  const today = now.toISOString().split('T')[0]
  const activeSub = await UserSubscription.findOne({
    labour: req.user._id,
    date: today,
    status: 'active'
  })

  if (!activeSub) {
    return sendError(res, {
      message: 'You need an active daily subscription to receive bookings today',
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: 'NO_ACTIVE_SUBSCRIPTION',
    })
  }

  next()
}
