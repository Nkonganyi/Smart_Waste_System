import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { reportsAPI, routesAPI } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navigation, X } from 'lucide-react'
import type { Report } from '@/types'
import L from 'leaflet'

// Fix for default marker icon issues in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const SelectedIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  popupAnchor: [1, -34],
  className: 'hue-rotate-[140deg] drop-shadow-md' // Greenish/Cyan for selected
})

L.Marker.prototype.options.icon = DefaultIcon

// Jitter function to prevent overlapping markers
const jitter = (coord: number) => coord + (Math.random() - 0.5) * 0.0001

// Helper to auto-fit bounds when route changes or data loads
function ChangeView({ bounds, markers }: { bounds: L.LatLngBoundsExpression | null, markers: Report[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] })
    } else if (markers.length > 0) {
      const markerBounds = L.latLngBounds(markers.map(m => [m.latitude, m.longitude]))
      map.fitBounds(markerBounds, { padding: [50, 50] })
    }
  }, [bounds, markers, map])
  
  return null
}

export function DashboardMapPreview() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPoints, setSelectedPoints] = useState<Report[]>([])
  const [routeData, setRouteData] = useState<any>(null)
  const [calculatingRoute, setCalculatingRoute] = useState(false)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await reportsAPI.getAllReports()
        const data = Array.isArray(response.data) ? response.data : []
        const validReports = data.filter((r: Report) => 
          r && 
          typeof r.latitude === 'number' && 
          typeof r.longitude === 'number' &&
          !isNaN(r.latitude) && 
          !isNaN(r.longitude) &&
          r.latitude !== 0 &&
          r.longitude !== 0
        )
        setReports(validReports)
      } catch (err) {
        console.error('Failed to fetch reports for map:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  const handleMarkerClick = (report: Report) => {
    if (selectedPoints.find(p => p.id === report.id)) {
      setSelectedPoints(selectedPoints.filter(p => p.id !== report.id))
      return
    }

    if (selectedPoints.length >= 2) {
      setSelectedPoints([selectedPoints[1], report])
    } else {
      setSelectedPoints([...selectedPoints, report])
    }
  }

  useEffect(() => {
    const getRoute = async () => {
      if (selectedPoints.length === 2) {
        setCalculatingRoute(true)
        try {
          // OpenRouteService expects Lng, Lat
          const locations = selectedPoints.map(p => ({
            longitude: p.longitude,
            latitude: p.latitude
          }))
          const response = await routesAPI.optimizeRoute(locations)
          setRouteData(response.data)
        } catch (err) {
          console.error('Failed to calculate route:', err)
          setRouteData(null)
        } finally {
          setCalculatingRoute(false)
        }
      } else {
        setRouteData(null)
      }
    }
    getRoute()
  }, [selectedPoints])

  const defaultCenter: [number, number] = [4.1537, 9.2685] // Buea
  const center: [number, number] = reports.length > 0 
    ? [reports[0].latitude, reports[0].longitude] 
    : defaultCenter

  // Parse geometry into Leaflet positions
  const routePositions: [number, number][] = routeData?.geometry?.features?.[0]?.geometry?.coordinates?.map(
    (coord: number[]) => [coord[1], coord[0]] // ORS returns [lng, lat]
  ) || []

  const routeBounds = routePositions.length > 0 
    ? L.latLngBounds(routePositions) 
    : null

  const distance = routeData?.geometry?.features?.[0]?.properties?.summary?.distance 
    ? (routeData.geometry.features[0].properties.summary.distance / 1000).toFixed(2) + ' km'
    : null
  
  const duration = routeData?.geometry?.features?.[0]?.properties?.summary?.duration
    ? Math.round(routeData.geometry.features[0].properties.summary.duration / 60) + ' min'
    : null

  return (
    <Card className="border-none shadow-soft overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold">Waste Location Map</CardTitle>
          <p className="text-sm text-muted-foreground">Select two points to visualize the optimal route</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPoints.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs gap-1"
              onClick={() => setSelectedPoints([])}
            >
              <X size={14} /> Clear Selection
            </Button>
          )}
          <Badge variant="outline" className="h-8">
            {reports.length} Reports
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        <div className="h-[500px] w-full">
          {loading ? (
            <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center text-muted-foreground">
              Loading map data...
            </div>
          ) : (
            <MapContainer 
              center={center} 
              zoom={13} 
              scrollWheelZoom={true}
              className="h-full w-full z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <ChangeView bounds={routeBounds} markers={reports} />

              {reports.map((report, idx) => {
                const isSelected = selectedPoints.some(p => p.id === report.id)
                
                // Check if this report has the same coordinates as any other report
                const hasDuplicate = reports.some((r, i) => i !== idx && r.latitude === report.latitude && r.longitude === report.longitude)
                const position: [number, number] = hasDuplicate 
                  ? [jitter(report.latitude), jitter(report.longitude)] 
                  : [report.latitude, report.longitude]

                return (
                  <Marker 
                    key={report.id} 
                    position={position}
                    icon={isSelected ? SelectedIcon : DefaultIcon}
                    eventHandlers={{
                      click: () => handleMarkerClick(report)
                    }}
                  >
                    <Popup>
                      <div className="p-1 min-w-[150px]">
                        <h4 className="font-bold text-sm mb-1">{report.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{report.location}</p>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={report.priority === 'high' ? 'destructive' : 'info'} className="text-[9px] px-1 py-0 uppercase">
                              {report.priority}
                            </Badge>
                            <span className="text-[10px] font-medium text-muted-foreground capitalize">
                              {report.status}
                            </span>
                          </div>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-7 text-[10px] w-full gap-1"
                            onClick={() => handleMarkerClick(report)}
                          >
                            <Navigation size={10} />
                            {isSelected ? 'Deselect' : 'Select for Route'}
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}

              {routePositions.length > 0 && (
                <Polyline 
                  positions={routePositions} 
                  color="hsl(var(--primary))" 
                  weight={4}
                  opacity={0.8}
                  dashArray="1, 8" // Optional: make it look like a path
                />
              )}
            </MapContainer>
          )}
        </div>

        {/* Route Info Overlay */}
        {(selectedPoints.length > 0 || calculatingRoute) && (
          <div className="absolute bottom-6 left-6 z-10 w-64 bg-card/95 backdrop-blur-sm border shadow-lg rounded-xl p-4 animate-in slide-in-from-bottom-4 duration-300">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Navigation size={14} className="text-primary" />
              Route Planner
            </h5>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-muted-foreground font-medium">START</p>
                  <p className="text-xs font-semibold truncate">{selectedPoints[0]?.title || 'Select point 1'}</p>
                </div>
              </div>

              <div className="ml-2.5 w-px h-4 bg-border" />

              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-info/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-info" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-muted-foreground font-medium">END</p>
                  <p className="text-xs font-semibold truncate">{selectedPoints[1]?.title || 'Select point 2'}</p>
                </div>
              </div>

              {(distance || duration || calculatingRoute) && (
                <div className="pt-3 border-t grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-[9px] text-muted-foreground font-bold">DISTANCE</p>
                    <p className="text-xs font-bold text-foreground">
                      {calculatingRoute ? '...' : distance || '--'}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-[9px] text-muted-foreground font-bold">EST. TIME</p>
                    <p className="text-xs font-bold text-foreground">
                      {calculatingRoute ? '...' : duration || '--'}
                    </p>
                  </div>
                </div>
              )}

              {selectedPoints.length === 2 && !calculatingRoute && !routeData && (
                <p className="text-[10px] text-destructive font-medium bg-destructive/10 p-2 rounded-md">
                  Failed to calculate route between these points.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
