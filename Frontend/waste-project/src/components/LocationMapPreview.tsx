import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet marker icon issue
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
    // Simulate fetching report locations
    // In production, this would fetch from backend
    const mockLocations: ReportLocation[] = [
      {
        id: '1',
        location: 'Main Street',
        latitude: 4.1537,
        longitude: 9.2685,
        priority: 'high',
        status: 'pending',
      },
      {
        id: '2',
        location: 'Park Avenue',
        latitude: 4.1545,
        longitude: 9.2695,
        priority: 'normal',
        status: 'in_progress',
      },
      {
        id: '3',
        location: 'Market Square',
        latitude: 4.1525,
        longitude: 9.2675,
        priority: 'low',
        status: 'completed',
      },
    ]
    setLocations(mockLocations)
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="h-80 flex items-center justify-center text-gray-400">Loading map...</div>
  }

  const center: [number, number] = [4.1537, 9.2685] // Default to Buea

  return (
    <div className="h-80 rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((location) => (
          <Marker key={location.id} position={[location.latitude, location.longitude]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{location.location}</p>
                <p className="text-xs text-gray-600">
                  <span className="capitalize font-medium">{location.priority}</span> priority
                </p>
                <p className="text-xs text-gray-600 capitalize">{location.status.replace('_', ' ')}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
