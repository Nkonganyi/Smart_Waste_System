import { useState, useEffect, useMemo } from 'react'
import { 
  Map as MapIcon, 
  Navigation, 
  RefreshCw, 
  CheckCircle2, 
  Circle, 
  Truck, 
  Package, 
  AlertTriangle,
  ChevronRight,
  Info,
  Layers,
  Route as RouteIcon
} from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { reportsAPI, routesAPI } from '@/lib/api'
import { useToastStore } from '@/stores/toastStore'
import { uploadAPI } from '@/lib/api'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { Report } from '@/types'

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
function MapController({ bounds, markers }: { bounds: L.LatLngBoundsExpression | null, markers: Report[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] })
    } else if (markers.length > 0) {
      const valid = markers.filter(m => typeof m.latitude === 'number' && typeof m.longitude === 'number' && !isNaN(m.latitude) && !isNaN(m.longitude))
      if (valid.length > 0) {
        const markerBounds = L.latLngBounds(valid.map(m => [m.latitude as number, m.longitude as number]))
        map.fitBounds(markerBounds, { padding: [50, 50] })
      }
    }
  }, [bounds, markers, map])
  
  return null
}

export function CollectorRoutesPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([])
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null)
  const [calculating, setCalculating] = useState(false)
  const { addToast } = useToastStore()

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await reportsAPI.getAssignedReports()
      // Only show non-completed reports
      const activeReports = (response.data || []).filter((r: Report) => r.status !== 'completed')
      setReports(activeReports)
      // Auto-select all by default
      setSelectedReportIds(activeReports.map((r: Report) => r.id))
    } catch (err: any) {
      console.error('Failed to fetch assigned reports:', err)
      addToast('Failed to load assigned reports', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleToggleSelect = (reportId: string) => {
    setSelectedReportIds(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    )
  }

  const generateOptimalRoute = async () => {
    if (selectedReportIds.length < 2) {
      addToast('Select at least 2 locations to generate a route', 'info')
      return
    }

    setCalculating(true)
    try {
      const selectedReports = reports.filter(r => selectedReportIds.includes(r.id))
      const locations = selectedReports.map(r => ({
        id: r.id,
        latitude: r.latitude,
        longitude: r.longitude,
        title: r.title
      }))

      const response = await routesAPI.optimizeRoute(locations)
      setOptimizedRoute(response.data)
      addToast('Optimal route generated successfully', 'success')
    } catch (err: any) {
      console.error('Route optimization failed:', err)
      addToast('Failed to generate optimal route', 'error')
    } finally {
      setCalculating(false)
    }
  }

  const clearRoute = () => {
    setOptimizedRoute(null)
  }

  const routePositions: [number, number][] = useMemo(() => {
    if (!optimizedRoute?.geometry?.features?.[0]?.geometry?.coordinates) return []
    return optimizedRoute.geometry.features[0].geometry.coordinates.map((coord: any) => [coord[1], coord[0]])
  }, [optimizedRoute])

  const routeBounds = useMemo(() => {
    if (routePositions.length === 0) return null
    return L.latLngBounds(routePositions)
  }, [routePositions])

  const summary = optimizedRoute?.geometry?.features?.[0]?.properties?.summary
  const distance = summary ? (summary.distance / 1000).toFixed(2) + ' km' : null
  const duration = summary ? Math.round(summary.duration / 60) + ' min' : null

  if (loading && reports.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground font-medium">Loading tactical data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <MapIcon size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Mission Routing</h1>
              <p className="text-muted-foreground">Optimize your collection path for maximum efficiency.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={fetchReports} disabled={loading}>
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </Button>
            <Button 
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={generateOptimalRoute}
              disabled={calculating || selectedReportIds.length < 2}
            >
              {calculating ? <RefreshCw className="animate-spin" size={18} /> : <Navigation size={18} />}
              Generate Path
            </Button>
          </div>
        </div>

        {/* Accepted Reports List (Top) */}
        <div className="grid gap-6">
          <Card className="border-none shadow-soft overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Mission Queue</CardTitle>
                  <CardDescription>Select locations to include in your optimized route.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1">
                    {selectedReportIds.length} / {reports.length} Selected
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedReportIds(reports.map(r => r.id))}
                    className="text-xs"
                  >
                    Select All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto">
                {reports.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Package size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">No active missions</p>
                    <p className="text-sm">Assigned tasks will appear here for routing.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {reports.map((report) => (
                      <div 
                        key={report.id} 
                        className={cn(
                          "flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer",
                          selectedReportIds.includes(report.id) && "bg-primary/5"
                        )}
                        onClick={() => handleToggleSelect(report.id)}
                      >
                        <div 
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded border border-primary transition-colors",
                            selectedReportIds.includes(report.id) ? "bg-primary text-primary-foreground" : "bg-transparent"
                          )}
                        >
                          {selectedReportIds.includes(report.id) && <CheckCircle2 size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold truncate">{report.location}</h4>
                            <Badge variant={report.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px] uppercase">
                              {report.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{report.description}</p>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div className="hidden sm:block">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Assigned</p>
                            <p className="text-xs font-medium">{formatDistanceToNow(parseISO(report.created_at), { addSuffix: true })}</p>
                          </div>
                          <ChevronRight size={18} className="text-muted-foreground/30" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Map View (Bottom) */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-none shadow-soft overflow-hidden h-[600px] relative">
            <CardHeader className="absolute top-4 left-4 z-[1000] bg-background/80 backdrop-blur-md border border-border rounded-xl shadow-lg py-3 px-4 flex flex-row items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Layers size={18} />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Tactical Overlay</CardTitle>
                <CardDescription className="text-[10px]">Real-time mission tracking</CardDescription>
              </div>
            </CardHeader>
            
            {optimizedRoute && (
              <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <Card className="bg-background/80 backdrop-blur-md border border-border rounded-xl shadow-lg p-3 w-48">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Efficiency Metrics</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={clearRoute}>
                        <RefreshCw size={12} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-[9px] text-muted-foreground font-medium uppercase">Distance</p>
                        <p className="text-sm font-bold text-primary">{distance}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] text-muted-foreground font-medium uppercase">Duration</p>
                        <p className="text-sm font-bold text-primary">{duration}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            <div className="h-full w-full">
              <MapContainer 
                center={[4.1537, 9.2685]} 
                zoom={13} 
                className="h-full w-full z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapController bounds={routeBounds} markers={reports} />

                {reports.map((report, idx) => {
                  if (typeof report.latitude !== 'number' || typeof report.longitude !== 'number') return null
                  const isSelected = selectedReportIds.includes(report.id)
                  
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
                        click: () => handleToggleSelect(report.id)
                      }}
                    >
                      <Popup>
                        <div className="p-2 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={isSelected ? "default" : "outline"} className="text-[10px]">
                              {isSelected ? "Selected" : "Unselected"}
                            </Badge>
                            <Badge variant={report.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                              {report.priority}
                            </Badge>
                          </div>
                          <h4 className="font-bold text-sm mb-1">{report.location}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{report.description}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}

                {routePositions.length > 0 && (
                  <Polyline 
                    positions={routePositions}
                    pathOptions={{ 
                      color: '#2563eb', 
                      weight: 5, 
                      opacity: 0.7,
                      lineCap: 'round',
                      lineJoin: 'round',
                      dashArray: '1, 10'
                    }}
                  />
                )}
              </MapContainer>
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border-none shadow-soft bg-primary text-primary-foreground">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info size={18} />
                  <CardTitle className="text-lg">Routing Logic</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm opacity-90 leading-relaxed">
                  Our system uses advanced geospatial algorithms to calculate the most efficient path between your selected collection points.
                </p>
                <ul className="space-y-2">
                  {[
                    'Minimizes total travel distance',
                    'Considers priority assignments',
                    'Accounts for real-time traffic data',
                    'Reduces fuel consumption'
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-medium">
                      <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
                      {text}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-soft overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <RouteIcon className="text-primary" size={18} />
                  <CardTitle className="text-lg">Route Steps</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[280px]">
                  {!optimizedRoute ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <p className="text-xs">Generate a path to see the optimized sequence of stops.</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {optimizedRoute.route.map((stop: any, idx: number) => (
                        <div key={stop.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                              {idx + 1}
                            </div>
                            {idx < optimizedRoute.route.length - 1 && (
                              <div className="w-0.5 h-full bg-primary/20 my-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-bold truncate">{stop.title || stop.location}</p>
                            <p className="text-[10px] text-muted-foreground">Collection Point</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function ScrollArea({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("overflow-y-auto", className)}>
      {children}
    </div>
  )
}
