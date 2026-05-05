import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { reportsAPI } from '@/lib/api'

// Fix Leaflet default marker icon paths (webpack/vite asset issue)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface ReportLocation {
  id: string
  location: string
  latitude: number
  longitude: number
  priority: string
  status: string
}

export function LocationMapPreview() {
  const [locations, setLocations] = useState<ReportLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await reportsAPI.getAllReports()
        const withCoords = (res.data || [])
          .filter((r: any) => r.latitude && r.longitude)
          .map((r: any) => ({
            id: r.id,
            location: r.location,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            priority: r.priority,
            status: r.status,
          }))
        setLocations(withCoords)
      } catch (err) {
        console.error('Failed to fetch map locations:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLocations()
  }, [])

  const center: [number, number] =
    locations.length > 0
      ? [locations[0].latitude, locations[0].longitude]
      : [4.1537, 9.2685] // Buea default

  if (loading) {
    return (
      <div className="h-52 flex items-center justify-center text-sm text-gray-400 bg-gray-50">
        Loading map…
      </div>
    )
  }

  return (
    <div className="h-52">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
            <Popup>
              <div className="text-sm min-w-32">
                <p className="font-semibold text-gray-900">{loc.location}</p>
                <p className="text-xs text-gray-500 capitalize mt-1">
                  {loc.priority} priority · {loc.status.replace('_', ' ')}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
