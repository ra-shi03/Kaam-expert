import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Polygon, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

function MapController({ center }) {
  const map = useMap()
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 12, { duration: 1.5 })
    }
  }, [center, map])
  
  return null
}

export function PolygonDrawer({ value, onChange, searchQuery }) {
  // value is expected to be a GeoJSON polygon: { type: 'Polygon', coordinates: [[[lng, lat], ...]] }
  // Leaflet uses [lat, lng], GeoJSON uses [lng, lat]
  
  const [points, setPoints] = useState([])
  const [mapCenter, setMapCenter] = useState(null)

  // Geocode searchQuery
  useEffect(() => {
    if (!searchQuery) return
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        if (data && data.length > 0) {
          setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)])
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
    } else {
      setPoints([])
    }
  }, [value])

  const handleMapClick = (latlng) => {
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
        <MapContainer 
          center={[20.5937, 78.9629]} // default center India
          zoom={4} 
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <MapController center={mapCenter} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onMapClick={handleMapClick} />
          {points.length > 0 && (
            <Polygon positions={points} pathOptions={{ color: '#4f46e5', weight: 2, fillColor: '#4f46e5', fillOpacity: 0.2 }} />
          )}
        </MapContainer>
      </div>
      <p className="text-[10px] text-slate-400">Click on the map to draw points of the boundary.</p>
    </div>
  )
}
