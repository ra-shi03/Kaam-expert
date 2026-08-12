import cron from 'node-cron'
import { UserSubscription } from '../models/UserSubscription.js'
import { SystemSetting } from '../models/SystemSetting.js'
import { Wallet } from '../models/Wallet.js'
import { WalletTransaction } from '../models/WalletTransaction.js'

// Run every hour at minute 5 to check if the operational window has ended dynamically
export function initSubscriptionRefundCron() {
  cron.schedule('5 * * * *', async () => {
    try {
      const settings = await SystemSetting.findOne({ configKey: 'master_config' })
      const endHour = settings?.subscriptionEndHour || 20
    const currentHour = new Date().getHours()

    // Only process refunds if the current hour matches the configured end hour
    if (currentHour !== endHour) {
      return
    }

    console.log(`[CRON] Operational window ended (${endHour}:00). Running daily subscription refund evaluation...`)
    const today = new Date().toISOString().split('T')[0]

    // Find all active subscriptions for today
    const subscriptions = await UserSubscription.find({
      date: today,
      status: 'active'
    }).populate('labour')

    for (const sub of subscriptions) {
      if (sub.bookingsReceived === 0) {
        // Refund eligible
        sub.refundEligibility = true
        sub.refundAmount = sub.amountPaid
        sub.refundStatus = 'refunded'
        sub.refundReason = 'Zero bookings received during operational window'
        sub.status = 'refunded'

        // Process actual refund to Labour's wallet
        let wallet = await Wallet.findOne({ user: sub.labour._id })
        if (!wallet) {
          wallet = await Wallet.create({ user: sub.labour._id })
        }

        wallet.balance += sub.refundAmount
        await wallet.save()

        await WalletTransaction.create({
          wallet: wallet._id,
          type: 'credit',
          amount: sub.refundAmount,
          description: `Refund for daily subscription (${today}) - 0 bookings`,
          referenceModel: 'UserSubscription',
          referenceId: sub._id,
          status: 'completed'
        })
      } else {
        // Not eligible
        sub.refundEligibility = false
        sub.refundStatus = 'not_eligible'
        sub.refundReason = `Received ${sub.bookingsReceived} booking(s)`
        sub.status = 'expired' // Day is over
      }
      
      await sub.save()
    }
    console.log(`[CRON] Subscription refund evaluation completed. Processed ${subscriptions.length} records.`)
  } catch (error) {
    console.error('[CRON] Error during subscription refund evaluation:', error)
  }
  })
}
