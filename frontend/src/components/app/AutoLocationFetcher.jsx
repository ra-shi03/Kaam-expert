import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useAuth } from '../../hooks/useAuth.js'
import { patchCurrentUser } from '../../api/userProfileApi.js'
import { setUser } from '../../store/slices/authSlice.js'
import { readAppUserLocation, writeAppUserLocation } from '../../lib/appUserLocationStorage.js'

const REFRESH_MS = 15 * 60 * 1000
const LAST_KEY = 'lc-auto-location-at'

async function reverseGeocode(lat, lng) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`)
    const data = await res.json()
    if (data.status !== 'OK' || !data.results?.[0]) return null
    const city = data.results[0].address_components?.find((c) => c.types.includes('locality'))?.long_name || ''
    return { address: data.results[0].formatted_address, city }
  } catch {
    return null
  }
}

/**
 * Silently fetches the device location when the app opens / returns to foreground
 * (customer, labour and contractor), saves it locally and syncs it to the profile.
 * Renders nothing; if permission is denied the user can still set it manually.
 */
export function AutoLocationFetcher() {
  const { realUser } = useAuth()
  const dispatch = useDispatch()
  const userId = realUser?._id || realUser?.id

  useEffect(() => {
    if (!userId || !navigator.geolocation) return undefined
    let cancelled = false
    let running = false

    const fetchLocation = () => {
      if (running || document.visibilityState === 'hidden') return
      const last = Number(sessionStorage.getItem(LAST_KEY) || 0)
      const stored = readAppUserLocation()
      const hasGps = stored?.lat != null && stored?.lng != null
      if (hasGps && Date.now() - last < REFRESH_MS) return
      running = true
      sessionStorage.setItem(LAST_KEY, String(Date.now()))

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          const geo = await reverseGeocode(lat, lng)
          if (cancelled) return
          const prev = readAppUserLocation()
          const address = geo?.address || (prev?.lat === lat && prev?.lng === lng ? prev.address : '') || ''
          const city = geo?.city ?? prev?.city ?? ''
          writeAppUserLocation({ address, lat, lng, city })
          window.dispatchEvent(new CustomEvent('lc-app-user-location-changed'))
          if (address || city) {
            patchCurrentUser({ currentLocation: address || undefined, city: city || undefined })
              .then((res) => {
                if (!cancelled && res?.data?.user) dispatch(setUser(res.data.user))
              })
              .catch(() => {})
          }
          running = false
        },
        () => {
          running = false // denied / unavailable: leave any saved location untouched
        },
        { enableHighAccuracy: false, timeout: 15_000, maximumAge: 5 * 60 * 1000 },
      )
    }

    fetchLocation()
    document.addEventListener('visibilitychange', fetchLocation)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', fetchLocation)
    }
  }, [userId, dispatch])

  return null
}
