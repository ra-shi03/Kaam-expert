import mongoose from 'mongoose'
import { Notification } from '../models/Notification.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS, sendError, sendSuccess } from '../utils/apiResponse.js'

/** GET /notifications?limit=30&page=1&unread=true */
export const listNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100)
  const page = Math.max(Number(req.query.page) || 1, 1)
  const filter = { userId: req.user._id }
  if (req.query.unread === 'true') filter.readAt = null

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user._id, readAt: null }),
  ])
  return sendSuccess(res, { data: { notifications: items, unreadCount, pagination: { total, page, limit } } })
})

/** GET /notifications/unread-count */
export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user._id, readAt: null })
  return sendSuccess(res, { data: { unreadCount: count } })
})

/** POST /notifications/:id/read */
export const markRead = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendError(res, { message: 'Invalid notification id', statusCode: HTTP_STATUS.BAD_REQUEST })
  }
  const doc = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true },
  )
  return sendSuccess(res, { message: 'Marked as read', data: { notification: doc } })
})

/** POST /notifications/read-all */
export const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany({ userId: req.user._id, readAt: null }, { $set: { readAt: new Date() } })
  return sendSuccess(res, { message: 'All notifications marked as read', data: { updated: result.modifiedCount } })
})
