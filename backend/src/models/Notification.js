import mongoose from 'mongoose'

/** In-app notification inbox. Every push sent through sendNotificationToUser is also stored here. */
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    /** snake_case type, e.g. booking_accepted, withdrawal_status — also used as the push `data.type` */
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    /** App route to open when tapped */
    url: { type: String, default: '/app' },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
)

notificationSchema.index({ userId: 1, createdAt: -1 })
// keep ~90 days of history
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema)
