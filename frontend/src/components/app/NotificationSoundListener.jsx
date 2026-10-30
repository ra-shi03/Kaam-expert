import { useEffect } from 'react'
import { useSocket } from '../../context/SocketContext.jsx'
import { installNotificationSoundUnlock, playNotificationSound } from '../../lib/notificationSound.js'

/** Socket events that should make a sound. New job offers are handled (with repeat) in BroadcastPopup. */
const SOUND_EVENTS = [
  'BOOKING_ACCEPTED',
  'BOOKING_FAILED',
  'BOOKING_STATUS_UPDATE',
  'BOOKING_UPDATED',
  'KYC_STATUS_UPDATE',
  'CASH_WALLET_RECHARGE_REQUIRED',
]

export function NotificationSoundListener() {
  const socket = useSocket()

  useEffect(() => {
    installNotificationSoundUnlock()
  }, [])

  useEffect(() => {
    if (!socket) return undefined
    const onEvent = () => playNotificationSound()
    SOUND_EVENTS.forEach((e) => socket.on(e, onEvent))
    return () => SOUND_EVENTS.forEach((e) => socket.off(e, onEvent))
  }, [socket])

  return null
}
