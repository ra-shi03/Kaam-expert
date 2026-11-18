import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess, sendError, HTTP_STATUS } from '../utils/apiResponse.js'
import { User } from '../models/User.js'
import { sendNotificationToUser } from '../utils/pushNotificationHelper.js'

/** Maps whatever the client sends ('web', 'mobile', 'android', 'ios') to the stored device platform. */
function normalizePlatform(raw) {
  const p = String(raw || 'web').toLowerCase()
  if (p === 'ios' || p === 'iphone') return 'ios'
  if (p === 'android' || p === 'mobile') return 'android'
  return 'web'
}

export const saveToken = asyncHandler(async (req, res) => {
  const { token, userAgent = '', appVersion = '' } = req.body
  if (!token || typeof token !== 'string') {
    return sendError(res, { message: 'Token is required', statusCode: HTTP_STATUS.BAD_REQUEST, code: 'MISSING_TOKEN' })
  }

  const platform = normalizePlatform(req.body.platform)
  // Web push tokens live in fcmTokens; native Android/iOS app tokens live in fcmTokenMobile
  const field = platform === 'web' ? 'fcmTokens' : 'fcmTokenMobile'
  const otherField = field === 'fcmTokens' ? 'fcmTokenMobile' : 'fcmTokens'
  const userId = req.user._id

  // A device token belongs to exactly one account: remove it from anyone else who had it on this device
  await User.updateMany({ _id: { $ne: userId }, $or: [{ fcmTokens: token }, { fcmTokenMobile: token }] }, { $pull: { fcmTokens: token, fcmTokenMobile: token, fcmDevices: { token } } })

  const user = await User.findById(userId)
  user[field] = (user[field] || []).filter((t) => t !== token)
  user[field].push(token)
  if (user[field].length > 10) user[field] = user[field].slice(-10)
  user[otherField] = (user[otherField] || []).filter((t) => t !== token)

  user.fcmDevices = (user.fcmDevices || []).filter((d) => d.token !== token)
  user.fcmDevices.push({ token, platform, userAgent: String(userAgent).slice(0, 200), appVersion: String(appVersion).slice(0, 40), updatedAt: new Date() })
  const live = new Set([...(user.fcmTokens || []), ...(user.fcmTokenMobile || [])])
  user.fcmDevices = user.fcmDevices.filter((d) => live.has(d.token)).slice(-20)

  await user.save()
  return sendSuccess(res, { message: 'FCM token saved', data: { platform, field } })
})

export const removeToken = asyncHandler(async (req, res) => {
  const { token } = req.body
  if (!token) {
    return sendError(res, { message: 'Token is required', statusCode: HTTP_STATUS.BAD_REQUEST, code: 'MISSING_TOKEN' })
  }

  // Remove it everywhere, whichever platform it was registered as
  await User.updateOne(
    { _id: req.user._id },
    { $pull: { fcmTokens: token, fcmTokenMobile: token, fcmDevices: { token } } },
  )
  return sendSuccess(res, { message: 'FCM token removed' })
})

/**
 * Sends a test push to every device of the signed-in user and reports, per device,
 * whether Firebase accepted it — so "notification not showing on my phone" can be diagnosed.
 */
export const testNotification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('fcmTokens fcmTokenMobile fcmDevices').lean()
  const deviceOf = (t) => (user.fcmDevices || []).find((d) => d.token === t)
  const tokens = [...new Set([...(user.fcmTokens || []), ...(user.fcmTokenMobile || [])])]

  if (tokens.length === 0) {
    return sendSuccess(res, {
      message: 'No devices are registered for push notifications on this account. Open the app on the phone, allow notifications, then try again.',
      data: { devices: [], registered: 0 },
    })
  }

  const response = await sendNotificationToUser(req.user._id, {
    title: 'Test Notification',
    body: 'This is a test notification from KaamExpert backend.',
    data: { type: 'test', url: '/app' },
  })

  const devices = (response?.results || []).map((r) => {
    const d = deviceOf(r.token)
    return {
      platform: d?.platform || ((user.fcmTokenMobile || []).includes(r.token) ? 'android' : 'web'),
      device: d?.userAgent ? d.userAgent.slice(0, 80) : 'unknown (registered before device tracking)',
      tokenEnd: r.token.slice(-6),
      delivered: r.ok,
      error: r.error,
    }
  })

  return sendSuccess(res, {
    message: response ? 'Test notification sent' : 'Push could not be sent — Firebase is not configured on the server',
    data: { registered: tokens.length, sent: devices.filter((d) => d.delivered).length, devices },
  })
})
