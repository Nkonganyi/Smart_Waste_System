import { useEffect, useState, useMemo } from 'react'
import { 
  Map as MapIcon, 
  List, 
  AlertTriangle, 
  RefreshCw,
  Search,
  Navigation,
  Clock,
  Truck,
  AlertCircle,
  ChevronRight,
  Phone,
  Mail,
  Maximize2,
  History,
  TrendingUp
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Custom Leaflet CSS to ensure map is visible
const mapStyles = `
  .leaflet-container {
    width: 100% !important;
    height: 600px !important;
    z-index: 1 !important;
    border-radius: 1rem !important;
  }
  .leaflet-tile-pane {
    opacity: 1 !important;
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = mapStyles;
  document.head.appendChild(style);
}

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { routesAPI } from '@/lib/api'
import { useToastStore } from '@/stores/toastStore'

// Fix Leaflet icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

// Types
interface Report {
  id: string
  title: string
  description: string
  location: string
  latitude: number
  longitude: number
  priority: 'low' | 'normal' | 'high'
  status: 'pending' | 'approved' | 'in-progress' | 'completed' | 'rejected'
  created_at: string
  image_url?: string
  bin_capacity?: number
  is_critical?: boolean
}

interface Collector {
  id: string
  name: string
  email: string
  avatar?: string
}

interface Route {
  collector: Collector
  reports: Report[]
  stats: {
    total: number
    completed: number
  }
  optimization: {
    ordered: Report[]
    geometry: any
    fallback: boolean
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200'
    case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Components
function MapCenterer({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 13)
  }, [center, map])
  return null
}

function MapResizer() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 500)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

export function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('active')
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailRoute, setDetailRoute] = useState<Route | null>(null)
  const addToast = useToastStore(state => state.addToast)

  useEffect(() => {
    fetchRoutes()
    const interval = setInterval(fetchRoutes, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchRoutes = async () => {
    try {
      setLoading(true)
      const response = await routesAPI.getAllRoutes()
      setRoutes(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch routes:', error)
      addToast('Failed to load routes data', 'error')
      setLoading(false)
    }
  }

  const filteredRoutes = useMemo(() => {
    const base = routes.filter(route => 
      route.collector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.reports.some(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    if (activeTab === 'completed') return base.filter(r => r.stats.completed === r.stats.total)
    return base.filter(r => r.stats.completed < r.stats.total)
  }, [routes, searchQuery, activeTab])

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] overflow-y-auto bg-background p-6 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <MapIcon size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Route Operations</h1>
            <p className="text-muted-foreground">Orchestrate and monitor collection logistics in real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Search collectors or routes..." 
              className="pl-10 h-11 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={fetchRoutes}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Top Section: Route Selection Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="active" className="rounded-lg px-6">Active Routes</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg px-6">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live Updates Enabled
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRoutes.map((route, idx) => (
            <RouteCard 
              key={idx} 
              route={route} 
              idx={idx} 
              selected={selectedRoute?.collector.id === route.collector.id}
              onClick={() => setSelectedRoute(route)}
              onViewDetails={() => {
                setDetailRoute(route)
                setIsDetailOpen(true)
              }}
            />
          ))}
          {filteredRoutes.length === 0 && !loading && (
            <Card className="col-span-full py-12 border-dashed">
              <div className="text-center text-muted-foreground">
                <Truck className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <p>No routes found matching your criteria</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Middle Section: Interactive Map */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Navigation className="text-primary" size={20} />
            Live Logistics View
          </h2>
          {selectedRoute && (
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              Tracking: {selectedRoute.collector.name}
            </Badge>
          )}
        </div>
        
        <div className="h-[600px] w-full relative rounded-2xl border shadow-lg bg-card overflow-hidden">
          <MapContainer 
            center={[4.155, 9.231]} 
            zoom={13} 
            style={{ height: '600px', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapResizer />
            
            {selectedRoute && selectedRoute.reports.length > 0 && selectedRoute.reports[0].latitude && selectedRoute.reports[0].longitude && (
              <MapCenterer center={[selectedRoute.reports[0].latitude, selectedRoute.reports[0].longitude]} />
            )}
            
            {(selectedRoute ? [selectedRoute] : routes).flatMap((route) => 
              route.reports
                .filter(report => report.latitude !== null && report.longitude !== null)
                .map((report) => (
                  <Marker 
                    key={report.id} 
                    position={[report.latitude, report.longitude]}
                    icon={L.divIcon({
                      className: 'custom-div-icon',
                      html: `
                        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                          <div style="height: 32px; width: 32px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; background-color: ${
                            report.status === 'completed' ? '#10b981' : 
                            report.priority === 'high' ? '#ef4444' : '#3b82f6'
                          }">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </div>
                        </div>
                      `,
                      iconSize: [32, 32],
                      iconAnchor: [16, 32]
                    })}
                  >
                    <Popup className="rounded-lg shadow-xl border-none">
                      <div className="p-2 space-y-2 min-w-[200px]">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={cn("text-[10px]", getStatusColor(report.status))}>
                            {report.status}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {report.priority}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-sm">{report.title}</h3>
                        <p className="text-xs text-muted-foreground">{report.location}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))
            )}

            {selectedRoute && selectedRoute.optimization.geometry && selectedRoute.optimization.geometry.coordinates && (
              <Polyline 
                positions={(() => {
                  try {
                    return selectedRoute.optimization.geometry.coordinates
                      .filter((coord: any) => coord && Array.isArray(coord) && coord.length >= 2)
                      .map((coord: any) => [coord[1], coord[0]])
                  } catch (e) {
                    console.warn('Invalid coordinates in route geometry:', e);
                    return [];
                  }
                })()}
                color="#3b82f6"
                weight={4}
                opacity={0.6}
                dashArray="10, 10"
              />
            )}
          </MapContainer>

          {/* Map Overlay: Legend */}
          <div className="absolute top-4 right-4 z-[1000]">
            <Card className="p-4 bg-background/90 backdrop-blur-md border shadow-2xl w-48 rounded-xl">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Map Legend</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                  <span className="text-xs font-medium">Collected</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
                  <span className="text-xs font-medium">Pending</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500 shadow-sm shadow-red-200 animate-pulse"></div>
                  <span className="text-xs font-medium">Critical</span>
                </div>
                <div className="pt-2 border-t mt-2">
                  <div className="flex items-center gap-3">
                    <div className="h-0.5 w-4 bg-blue-500 border-dashed border-t-2"></div>
                    <span className="text-xs font-medium">Optimized Path</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Panel (Mobile/Small Split) */}
          {selectedRoute && (
            <div className="absolute bottom-6 left-6 right-6 z-10 transition-all animate-in slide-in-from-bottom-4">
              <Card className="bg-background/95 backdrop-blur-sm shadow-2xl border-primary/20">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                      {selectedRoute.collector.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{selectedRoute.collector.name}</h3>
                        <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-200">
                          On Route
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock size={14} /> Est. Completion: 2:45 PM • <AlertCircle size={14} className="text-yellow-600" /> 1 delay alert
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4 hidden md:block">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Speed</p>
                      <p className="text-lg font-mono font-bold">24 km/h</p>
                    </div>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Phone size={18} />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Mail size={18} />
                    </Button>
                    <Button className="gap-2 px-6" onClick={() => {
                      setDetailRoute(selectedRoute)
                      setIsDetailOpen(true)
                    }}>
                      <List size={18} /> View Points
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedRoute(null)}>
                      <ChevronRight size={24} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Analytics & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Performance Chart */}
        <Card className="lg:col-span-2 rounded-2xl border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              <CardTitle>Collector Efficiency</CardTitle>
            </div>
            <CardDescription>Completion rates across all active routes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routes.map(r => ({ 
                  name: r.collector.name.split(' ')[0], 
                  efficiency: r.stats.total > 0 ? Math.round((r.stats.completed / r.stats.total) * 100) : 0 
                }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} unit="%" />
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="efficiency" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Live Alerts */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              <CardTitle>System Alerts</CardTitle>
            </div>
            <CardDescription>Critical issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AlertCard 
              title="Route Delay: RT-102" 
              description="Collector Diego R. is 15 mins behind schedule."
              type="warning"
            />
            <AlertCard 
              title="Bin Blocked: Market Sq" 
              description="Access to bin R-452 is currently blocked."
              type="error"
            />
          </CardContent>
        </Card>
      </div>

      {/* Route Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-2 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">Route Details: {detailRoute?.collector.name}</DialogTitle>
                <DialogDescription>
                  Full collection history and bin inventory for this route
                </DialogDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                RT-{detailRoute ? 100 + routes.indexOf(detailRoute) : ''}
              </Badge>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex">
            {/* Left: Bin List */}
            <div className="w-1/2 border-r flex flex-col">
              <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
                <h4 className="font-bold text-sm">Collection Points ({detailRoute?.reports.length})</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{detailRoute?.stats.completed}/{detailRoute?.stats.total} Done</Badge>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="divide-y">
                  {detailRoute?.reports.map((bin) => (
                    <div key={bin.id} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{bin.title}</span>
                          {bin.is_critical && (
                            <Badge className="bg-red-500 text-[8px] h-4">CRITICAL</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{bin.location}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock size={10} /> {new Date(bin.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Navigation size={10} /> {bin.latitude?.toFixed(3) || '0.000'}, {bin.longitude?.toFixed(3) || '0.000'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-[10px] font-bold uppercase text-muted-foreground">Capacity</div>
                        <div className="w-20 space-y-1">
                          <Progress value={bin.bin_capacity || 0} className={cn("h-1.5", (bin.bin_capacity || 0) > 80 ? "[&>div]:bg-red-500" : "")} />
                          <div className="text-[10px] font-mono">{bin.bin_capacity || 0}%</div>
                        </div>
                        <Badge variant="outline" className={cn("text-[8px]", 
                          bin.status === 'completed' ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                          {bin.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right: Info & Actions */}
            <div className="w-1/2 p-6 space-y-6 overflow-y-auto">
              <div>
                <h4 className="font-bold text-sm mb-4">Collector Information</h4>
                <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl">
                  <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                    {detailRoute?.collector.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold">{detailRoute?.collector.name}</h5>
                    <p className="text-sm text-muted-foreground">{detailRoute?.collector.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                        <Phone size={12} /> Call
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                        <Mail size={12} /> Email
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-4">Route Performance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-muted/20 border-none shadow-none">
                    <CardContent className="p-4">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Total Distance</p>
                      <p className="text-2xl font-bold">18.2 <span className="text-sm font-normal text-muted-foreground">km</span></p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/20 border-none shadow-none">
                    <CardContent className="p-4">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Time Elapsed</p>
                      <p className="text-2xl font-bold">1h 24m</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full gap-2 py-6 text-base font-bold">
                  <Navigation size={20} /> Optimized Navigation
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="gap-2">
                    <History size={16} /> History
                  </Button>
                  <Button variant="destructive" className="gap-2">
                    <AlertTriangle size={16} /> Report Issue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RouteCard({ route, idx, selected, onClick, onViewDetails }: { route: Route, idx: number, selected: boolean, onClick: () => void, onViewDetails: () => void }) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:ring-2 hover:ring-primary/20",
        selected ? "ring-2 ring-primary" : ""
      )}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", getStatusColor(route.stats.completed === route.stats.total ? 'completed' : 'in-progress'))}>
            {route.stats.completed === route.stats.total ? 'Completed' : 'In Progress'}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
            RT-{100 + idx}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {route.collector.name.charAt(0)}
          </div>
          <div>
            <CardTitle className="text-base">{route.collector.name}</CardTitle>
            <CardDescription className="text-xs flex items-center gap-1">
              <Navigation size={12} /> {route.reports.length} stops • Douala Sector
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-3 gap-2 my-4">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <span className="block text-lg font-bold">{route.reports.length}</span>
            <span className="text-[10px] text-muted-foreground uppercase">Bins</span>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <span className="block text-lg font-bold">12.4</span>
            <span className="text-[10px] text-muted-foreground uppercase">KM</span>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <span className="block text-lg font-bold">45</span>
            <span className="text-[10px] text-muted-foreground uppercase">Min</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round((route.stats.completed / route.stats.total) * 100)}%</span>
          </div>
          <Progress value={(route.stats.completed / route.stats.total) * 100} className="h-2" />
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={(e) => {
            e.stopPropagation()
            onViewDetails()
          }}>Details</Button>
          <Button size="sm" className="flex-1 text-xs">Reassign</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AlertCard({ title, description, type }: { title: string, description: string, type: 'warning' | 'error' }) {
  return (
    <Card className={cn(
      "border-l-4",
      type === 'warning' ? "border-l-yellow-500" : "border-l-red-500"
    )}>
      <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3">
        {type === 'warning' ? <AlertTriangle className="text-yellow-500" size={18} /> : <AlertCircle className="text-red-500" size={18} />}
        <CardTitle className="text-sm font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="flex gap-2 mt-3">
          <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2">Acknowledge</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2">Resolve</Button>
        </div>
      </CardContent>
    </Card>
  )
}
