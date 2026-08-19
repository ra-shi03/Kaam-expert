import { useState, useEffect, useCallback, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Polygon, Polyline, Marker } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '100%'
}

export function PolygonDrawer({ value, onChange, searchQuery }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  })

  // points are stored as [lat, lng] array format internally to match original logic and GeoJSON conversion
  const [points, setPoints] = useState([])
  const [mapCenter, setMapCenter] = useState(null)
  
  const mapRef = useRef(null)

  const onLoad = useCallback(function callback(map) {
    mapRef.current = map
  }, [])

  const onUnmount = useCallback(function callback(map) {
    mapRef.current = null
  }, [])

  // Geocode searchQuery
  useEffect(() => {
    if (!searchQuery) return
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`)
        const data = await res.json()
        if (data.results && data.results.length > 0) {
          const loc = data.results[0].geometry.location
          setMapCenter({ lat: loc.lat, lng: loc.lng })
          if (mapRef.current) {
            mapRef.current.panTo({ lat: loc.lat, lng: loc.lng })
            mapRef.current.setZoom(12)
          }
        }
      } catch (err) {
        console.error('Geocoding failed:', err)
      }
    }, 1500) // 1.5s debounce

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  // Init points from value if present
  useEffect(() => {
    if (value && value.coordinates && value.coordinates[0]) {
      const coords = value.coordinates[0]
      // pop the last point if it matches the first (GeoJSON requirement)
      let parsed = coords.map(c => [c[1], c[0]])
      if (parsed.length > 2 && 
          parsed[0][0] === parsed[parsed.length - 1][0] && 
          parsed[0][1] === parsed[parsed.length - 1][1]) {
        parsed = parsed.slice(0, -1)
      }
      setPoints(parsed)
      // also if we have points, center the map to the first point
      if (parsed.length > 0 && !mapCenter) {
        setMapCenter({ lat: parsed[0][0], lng: parsed[0][1] })
      }
    } else {
      setPoints([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]) // mapCenter is excluded so it only centers on init

  const handleMapClick = (e) => {
    const latlng = [e.latLng.lat(), e.latLng.lng()]
    const newPoints = [...points, latlng]
    setPoints(newPoints)
    triggerOnChange(newPoints)
  }

  const handleClear = () => {
    setPoints([])
    onChange(null)
  }

  const handleUndo = () => {
    const newPoints = points.slice(0, -1)
    setPoints(newPoints)
    triggerOnChange(newPoints)
  }

  const triggerOnChange = (pts) => {
    if (pts.length < 3) {
      // not a valid polygon yet
      onChange(null)
      return
    }
    
    // GeoJSON requires [lng, lat] and first == last
    const coordinates = pts.map(p => [p[1], p[0]])
    coordinates.push([...coordinates[0]]) // close the polygon

    onChange({
      type: 'Polygon',
      coordinates: [coordinates]
    })
  }

  const handleMarkerDragEnd = (e, idx) => {
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    const newPoints = [...points]
    newPoints[idx] = [lat, lng]
    setPoints(newPoints)
    triggerOnChange(newPoints)
  }

  const googleMapPaths = points.map(p => ({ lat: p[0], lng: p[1] }))

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleUndo}
          disabled={points.length === 0}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
        >
          Undo Point
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={points.length === 0}
          className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50"
        >
          Clear All
        </button>
        <span className="text-xs text-slate-500 py-1.5 ml-auto">
          {points.length < 3 ? `Need ${3 - points.length} more points` : `${points.length} points drawn`}
        </span>
      </div>
      
      <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 relative z-0">
        {!isLoaded ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
            Loading Google Maps...
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter || { lat: 20.5937, lng: 78.9629 }}
            zoom={mapCenter ? 12 : 4}
            onClick={handleMapClick}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false
            }}
          >
            {points.length > 0 && points.length < 3 && (
               <Polyline 
                 path={googleMapPaths} 
                 options={{ strokeColor: '#4f46e5', strokeWeight: 2 }} 
               />
            )}
            
            {points.length >= 3 && (
              <Polygon 
                paths={googleMapPaths} 
                options={{ 
                  fillColor: '#4f46e5', 
                  fillOpacity: 0.2, 
                  strokeColor: '#4f46e5', 
                  strokeWeight: 2 
                }} 
              />
            )}
            
            {points.map((p, idx) => (
              <Marker 
                key={idx} 
                draggable={true}
                onDragEnd={(e) => handleMarkerDragEnd(e, idx)}
                position={{ lat: p[0], lng: p[1] }} 
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 6,
                  fillColor: '#4f46e5',
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: '#ffffff'
                }}
              />
            ))}
          </GoogleMap>
        )}
      </div>
      <p className="text-[10px] text-slate-400">Click on the map to draw points, drag points to adjust the boundary.</p>
    </div>
  )
}
