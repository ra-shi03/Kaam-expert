import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useSelector } from 'react-redux'
import { broadcastsApi } from '../api/broadcastsApi.js'

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5005/api/v1').replace('/api/v1', '')

let currentSocket = null
let currentToken = null

export function useLabourSocket() {
  const { token } = useSelector((state) => state.auth)
  const [socketStatus, setSocketStatus] = useState('disconnected')
  const [liveOffers, setLiveOffers] = useState([])
  const socketRef = useRef(null)

  useEffect(() => {
    if (!token) {
      if (currentSocket) {
        currentSocket.disconnect()
        currentSocket = null
        currentToken = null
      }
      setSocketStatus('disconnected')
      return
    }

    if (currentSocket && currentToken === token) {
      socketRef.current = currentSocket
      setSocketStatus(currentSocket.connected ? 'connected' : 'disconnected')
    } else {
      if (currentSocket) {
        currentSocket.disconnect()
      }

      const socket = io(BACKEND_URL, {
        auth: { token },
        transports: ['websocket'],
      })
      
      currentSocket = socket
      currentToken = token
      socketRef.current = socket
    }

    const socket = currentSocket

    const onConnect = () => setSocketStatus('connected')
    const onDisconnect = () => setSocketStatus('disconnected')
    const onConnectError = (err) => console.error('Socket error:', err)
    
    // Flash Broadcast Received
    const onBookingReceived = (data) => {
      setLiveOffers((prev) => {
        if (prev.find(o => o.bookingId === data.bookingId)) return prev
        return [...prev, { ...data, receivedAt: Date.now() }]
      })
    }

    // Broadcast expired or accepted by someone else
    const onBookingExpired = (data) => {
      setLiveOffers((prev) => prev.filter(o => o.bookingId !== data.bookingId))
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('BOOKING_RECEIVED', onBookingReceived)
    socket.on('BOOKING_EXPIRED', onBookingExpired)

    const loadPending = () => {
      broadcastsApi.getPendingBroadcasts()
        .then((res) => {
          const offers = res.data?.offers || []
          if (!offers.length) return
          setLiveOffers((prev) => {
            const next = [...prev]
            offers.forEach((offer) => {
              const id = String(offer.bookingId)
              if (!next.find((o) => String(o.bookingId) === id)) {
                next.push({ ...offer, receivedAt: Date.now() })
              }
            })
            return next
          })
        })
        .catch((err) => console.warn('Failed to load pending broadcasts', err))
    }

    socket.on('connect', loadPending)

    // Trigger connect if already connected
    if (socket.connected) {
      onConnect()
      loadPending()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadPending()
    }

    window.addEventListener('focus', loadPending)
    document.addEventListener('visibilitychange', handleVisibility)
    const pollInterval = setInterval(loadPending, 8000)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('BOOKING_RECEIVED', onBookingReceived)
      socket.off('BOOKING_EXPIRED', onBookingExpired)
      window.removeEventListener('focus', loadPending)
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(pollInterval)
      // Do not disconnect the socket here to avoid React Strict Mode closing it
    }
  }, [token])

  const removeOfferLocal = (bookingId) => {
    setLiveOffers((prev) => prev.filter(o => o.bookingId !== bookingId))
  }

  return { socketStatus, liveOffers, removeOfferLocal }
}
