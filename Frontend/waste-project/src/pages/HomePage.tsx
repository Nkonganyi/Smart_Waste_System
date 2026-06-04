import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { reportsAPI } from '@/lib/api'
import { 
  ArrowRight, 
  Activity, 
  Globe, 
  Zap, 
  Shield, 
  BarChart3, 
  Navigation,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  Menu,
  X,
  Leaf,
  Layers
} from 'lucide-react'

export function HomePage() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const [counts, setCounts] = useState({ reports: 0, pickups: 0, collectors: 0, pending: 0 })
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    
    let mounted = true
    async function load() {
      try {
        const summary = await reportsAPI.getPublicHomepageSummary()
        if (!mounted) return
        const data = summary?.data || {}
        setCounts({
          reports: data.total_reports ?? 0,
          pickups: data.completed_reports ?? 0,
          collectors: data.collectors ?? 0,
          pending: data.pending_reports ?? 0,
        })
      } catch (err) {
        console.error('Home page data load failed', err)
      }
    }
    load()
    return () => { 
      mounted = false
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const navLinks = [
    { name: 'Solutions', href: '#solutions' },
    { name: 'Technology', href: '#tech' },
    { name: 'Impact', href: '#impact' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-200/40 via-white to-emerald-100/20 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* HEADER / NAVIGATION */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-white/80 backdrop-blur-2xl border-b border-emerald-100/50 py-4 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.2)]' 
            : 'bg-transparent py-8'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative">
              <div className="w-14 h-14 bg-emerald-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-emerald-200 group-hover:scale-110 transition-all duration-500 overflow-hidden rotate-3 group-hover:rotate-0">
                <Globe className="text-white w-7 h-7 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600 via-emerald-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-azure-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-bounce-subtle">
                <Leaf className="text-white w-3 h-3" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-3xl font-black tracking-tighter text-slate-900">
                Eco<span className="text-emerald-600">Sync</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600/60 mt-1">Smart City Hub</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2 p-1.5 bg-white/40 backdrop-blur-md rounded-full border border-emerald-100/50 shadow-inner-soft">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                className="px-8 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-emerald-700 hover:bg-white rounded-full transition-all duration-300 shadow-sm hover:shadow-emerald-100"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to={user?.role === 'admin' ? '/admin' : user?.role === 'collector' ? '/collector' : '/citizen'}>
                  <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-full px-8">
                    Console
                  </Button>
                </Link>
                <div className="h-8 w-px bg-emerald-100/50 mx-1" />
                <Button 
                  onClick={() => logout()} 
                  variant="outline" 
                  className="rounded-full px-8 border-emerald-100 bg-white/50 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-emerald-50 transition-all duration-300"
                >
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-full px-8">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="rounded-full px-10 h-12 bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-slate-200 hover:shadow-emerald-200 transition-all duration-500">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 shadow-sm" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-4 right-4 mt-6 bg-white/95 backdrop-blur-2xl border border-emerald-100 p-8 rounded-[2.5rem] shadow-3xl space-y-6 animate-fade-in">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                className="block p-5 text-xl font-black text-slate-700 hover:bg-emerald-50 rounded-3xl transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="pt-6 flex flex-col gap-4">
              {isAuthenticated ? (
                <Link to="/citizen" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full rounded-3xl h-16 text-lg font-black">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-3xl h-16 text-lg font-black">Sign In</Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full rounded-3xl h-16 bg-slate-900 text-white text-lg font-black">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-40 pb-24 lg:pt-64 lg:pb-48 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[1000px] h-[1000px] bg-emerald-100/40 rounded-full blur-[120px] -z-10" />
          <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[800px] h-[800px] bg-azure-100/40 rounded-full blur-[120px] -z-10" />

          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-20 items-center">
              <div className="text-left space-y-12">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-100/60 border border-emerald-200 text-emerald-900 text-[11px] font-black uppercase tracking-[0.3em] animate-fade-in shadow-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  Smart Waste Intelligence 2.0
                </div>
                
                <h1 className="text-6xl lg:text-[7.5rem] font-black tracking-tighter text-slate-900 leading-[0.85]">
                  City <br />
                  <span className="text-emerald-600">Cleaned.</span> <br />
                  <span className="text-azure-500">Synced.</span>
                </h1>
                
                <p className="text-xl lg:text-2xl text-slate-600 leading-relaxed font-medium max-w-xl">
                  Synchronizing citizens and municipal field crews through a high-performance 
                  AI-driven logistics layer for cleaner urban environments.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <Link to="/register">
                    <Button size="lg" className="h-20 px-12 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-black shadow-2xl shadow-emerald-200 group transition-all duration-500">
                      Get Started
                      <ArrowRight className="ml-3 w-8 h-8 transition-transform group-hover:translate-x-3" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg" className="h-20 px-12 rounded-[2rem] border-emerald-100 bg-white/50 backdrop-blur-sm text-slate-700 hover:bg-white text-xl font-black transition-all duration-500">
                      Live Stats
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative group lg:scale-110 lg:translate-x-8">
                {/* PRIMARY HERO IMAGE */}
                <div className="relative rounded-[4rem] overflow-hidden border-8 border-white shadow-3xl bg-white transform rotate-2 group-hover:rotate-0 transition-all duration-700 p-2">
                  <img 
                    src="/pictures/Home/Sample7.jpg" 
                    alt="Eco-tech City" 
                    className="w-full h-auto rounded-[3.5rem] grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent opacity-60" />
                </div>

                {/* OVERLAY DASHBOARD PREVIEW */}
                <div className="absolute -bottom-12 -left-16 w-3/4 animate-bounce-subtle">
                  <div className="rounded-[3rem] overflow-hidden border-4 border-white shadow-3xl bg-white p-1">
                    <img 
                      src="/pictures/Home/Sample8.jpg" 
                      alt="System Interface" 
                      className="w-full h-auto rounded-[2.5rem]"
                    />
                  </div>
                </div>

                {/* Floating Metric Badge */}
                <div className="absolute -top-10 -right-6 bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-3xl border border-emerald-50/50 animate-pulse-slow">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-azure-100 rounded-3xl flex items-center justify-center">
                      <Zap className="text-azure-600 w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-azure-600/60 uppercase tracking-[0.2em]">Eco Impact</p>
                      <p className="text-3xl font-black text-slate-900">High</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS SECTION: OPERATIONAL HUD */}
        <section className="relative z-10 -mt-12 mb-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-emerald-100/50 p-2 shadow-[0_32px_64px_-16px_rgba(16,185,129,0.1)]">
              <div className="bg-white/60 rounded-[2.5rem] p-8 lg:p-12">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 divide-y lg:divide-y-0 lg:divide-x divide-emerald-100/50">
                  {[
                    { 
                      label: 'Reports Resolved', 
                      value: counts.reports, 
                      suffix: '+', 
                      color: 'emerald', 
                      icon: CheckCircle2,
                      desc: 'Verified by network'
                    },
                    { 
                      label: 'Active Collectors', 
                      value: counts.collectors, 
                      suffix: '', 
                      color: 'azure', 
                      icon: Users,
                      desc: 'Live in the field',
                      live: true
                    },
                    { 
                      label: 'Waste Diverted', 
                      value: '12.4', 
                      suffix: 't', 
                      color: 'emerald', 
                      icon: Leaf,
                      desc: 'Landfill reduction'
                    },
                    { 
                      label: 'System Uptime', 
                      value: '99.9', 
                      suffix: '%', 
                      color: 'slate', 
                      icon: Activity,
                      desc: 'Operational sync'
                    },
                  ].map((stat, i) => (
                    <div key={i} className="px-8 first:pl-0 last:pr-0 py-6 lg:py-0 group">
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                          <stat.icon className={`text-${stat.color}-600 w-6 h-6`} />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{stat.label}</p>
                            {stat.live && (
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] font-bold text-emerald-600/60 mt-1">{stat.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter transition-all group-hover:text-emerald-600 duration-500">
                          {stat.value}
                        </span>
                        <span className="text-2xl font-black text-slate-300">{stat.suffix}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SOLUTIONS / FEATURES SECTION */}
        <section id="solutions" className="py-24 lg:py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row justify-between items-end gap-16 mb-24">
              <div className="max-w-2xl text-left">
                <div className="inline-flex items-center gap-4 text-emerald-600 font-black text-[11px] uppercase tracking-[0.5em] mb-8">
                  <div className="w-12 h-[3px] bg-emerald-600 rounded-full" />
                  The Protocol
                </div>
                <h3 className="text-6xl lg:text-8xl font-black text-slate-900 leading-[0.85] tracking-tighter">
                  Intelligent <br />
                  <span className="text-emerald-600">Operations.</span>
                </h3>
              </div>
              <div className="max-w-md pb-4">
                <p className="text-xl text-slate-500 leading-relaxed font-medium border-l-4 border-emerald-500/30 pl-8">
                  Redefining municipal hygiene through geospatial intelligence and real-time field synchronization.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {[
                { 
                  icon: Navigation, 
                  title: 'Dynamic Routing', 
                  color: 'emerald', 
                  desc: 'Proprietary GIS engine recalculating pickup paths in real-time to minimize carbon footprint and response time.',
                  tag: 'Logistics'
                },
                { 
                  icon: BarChart3, 
                  title: 'Network Intel', 
                  color: 'azure', 
                  desc: 'Deep-layer analytics identifying waste hotspots and optimizing city-wide collection cycles through AI.',
                  tag: 'Analytics'
                },
                { 
                  icon: Shield, 
                  title: 'Verified Proof', 
                  color: 'slate', 
                  desc: 'Immutable photographic verification for every action, ensuring 100% municipal accountability and transparency.',
                  tag: 'Security'
                },
              ].map((feat, i) => (
                <div key={i} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[3rem] -z-10 shadow-2xl shadow-emerald-500/5" />
                  <div className="p-10 lg:p-12 rounded-[3.5rem] border border-emerald-100/50 bg-white/40 backdrop-blur-sm group-hover:bg-white group-hover:border-emerald-200 transition-all duration-500 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-12">
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-inner-soft group-hover:shadow-lg ${
                        feat.color === 'emerald' ? 'bg-emerald-50 group-hover:bg-emerald-600 group-hover:shadow-emerald-200' :
                        feat.color === 'azure' ? 'bg-azure-50 group-hover:bg-azure-600 group-hover:shadow-azure-200' :
                        'bg-slate-100 group-hover:bg-slate-900 group-hover:shadow-slate-200'
                      }`}>
                        <feat.icon className={`w-9 h-9 transition-colors duration-500 ${
                          feat.color === 'emerald' ? 'text-emerald-600 group-hover:text-white' :
                          feat.color === 'azure' ? 'text-azure-600 group-hover:text-white' :
                          'text-slate-900 group-hover:text-white'
                        }`} />
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">{feat.tag}</span>
                    </div>
                    <h4 className="text-3xl font-black text-slate-900 mb-6 tracking-tight group-hover:translate-x-1 transition-transform">{feat.title}</h4>
                    <p className="text-lg text-slate-500 leading-relaxed font-medium mb-10 flex-grow">
                      {feat.desc}
                    </p>
                    <div className="h-1 w-12 bg-emerald-100 group-hover:w-full transition-all duration-700 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WORKFLOW / HOW IT WORKS */}
        <section id="tech" className="py-32 lg:py-48 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-950/20 to-transparent" />
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto mb-40">
              <h2 className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.6em] mb-8">Citizen Protocol</h2>
              <h3 className="text-6xl lg:text-[7.5rem] font-black mb-12 tracking-tighter leading-none">The Report <br /><span className="text-emerald-500">Lifecycle.</span></h3>
              <p className="text-2xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                From discovery to verified resolution—here is how EcoSync synchronizes your city in real-time.
              </p>
            </div>

            <div className="space-y-64">
              {/* Step 1: Capture */}
              <div className="grid lg:grid-cols-2 gap-32 items-center">
                <div className="space-y-12">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-emerald-500/10 text-emerald-400 font-black text-3xl border border-emerald-500/20 shadow-3xl shadow-emerald-500/20">
                    01
                  </div>
                  <h4 className="text-5xl font-black tracking-tighter">Spot & Capture</h4>
                  <p className="text-2xl text-slate-400 leading-relaxed font-medium">
                    Encounter a waste issue? Simply open the EcoSync portal on your device. Take a high-resolution photo of the site—our system handles the rest.
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-start gap-5 p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-colors">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Navigation className="text-emerald-500 w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white mb-1">Precision GPS Anchor</p>
                        <p className="text-slate-400 text-sm">Every report is automatically tagged with exact spatial coordinates for the field crew.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <div className="rounded-[5rem] overflow-hidden border-8 border-white/10 shadow-4xl bg-white/5 p-6 group-hover:border-emerald-500/20 transition-all duration-700">
                    <img src="/pictures/Home/Sample10.jpg" alt="Citizen Reporting" className="rounded-[3.5rem] w-full h-auto opacity-80 group-hover:opacity-100 transition-all duration-1000 scale-110 group-hover:scale-100" />
                  </div>
                  <div className="absolute -z-10 -top-24 -right-24 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
                </div>
              </div>

              {/* Step 2: System Validation */}
              <div className="grid lg:grid-cols-2 gap-32 items-center lg:direction-rtl">
                <div className="space-y-12 lg:order-2">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-azure-500/10 text-azure-400 font-black text-3xl border border-azure-500/20 shadow-3xl shadow-azure-500/20">
                    02
                  </div>
                  <h4 className="text-5xl font-black tracking-tighter text-azure-400">Admin Validation</h4>
                  <p className="text-2xl text-slate-400 leading-relaxed font-medium">
                    Once submitted, your report enters the system for review. Our administrative team validates the data, checks for duplicates, and categorizes the waste to ensure the right crew is notified.
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-start gap-5 p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-azure-500/30 transition-colors">
                      <div className="w-12 h-12 bg-azure-500/10 rounded-2xl flex items-center justify-center shrink-0">
                        <FileText className="text-azure-500 w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white mb-1">Data Verification</p>
                        <p className="text-slate-400 text-sm">Human-in-the-loop validation ensures every report is accurate and actionable before dispatch.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative group lg:order-1">
                  <div className="rounded-[5rem] overflow-hidden border-8 border-white/10 shadow-4xl bg-white/5 p-6 group-hover:border-azure-500/20 transition-all duration-700">
                    <img src="/pictures/Home/Sample8.jpg" alt="Report Validation" className="rounded-[3.5rem] w-full h-auto opacity-80 group-hover:opacity-100 transition-all duration-1000 scale-110 group-hover:scale-100" />
                  </div>
                  <div className="absolute -z-10 -bottom-24 -left-24 w-[500px] h-[500px] bg-azure-500/10 rounded-full blur-[120px]" />
                </div>
              </div>

              {/* Step 3: Dispatch */}
              <div className="grid lg:grid-cols-2 gap-32 items-center">
                <div className="space-y-12">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-emerald-500/10 text-emerald-400 font-black text-3xl border border-emerald-500/20 shadow-3xl shadow-emerald-500/20">
                    03
                  </div>
                  <h4 className="text-5xl font-black tracking-tighter">Live Dispatch</h4>
                  <p className="text-2xl text-slate-400 leading-relaxed font-medium">
                    The command center validates your report and assigns it to the nearest available collector using dynamic route optimization.
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-start gap-5 p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-colors">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Activity className="text-emerald-500 w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white mb-1">Real-time HUD</p>
                        <p className="text-slate-400 text-sm">Track your report's status in the app as it moves from 'Pending' to 'In Progress'.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <div className="rounded-[5rem] overflow-hidden border-8 border-white/10 shadow-4xl bg-white/5 p-6 group-hover:border-emerald-500/20 transition-all duration-700">
                    <img src="/pictures/Home/Sample9.jpg" alt="Dispatch Console" className="rounded-[3.5rem] w-full h-auto opacity-80 group-hover:opacity-100 transition-all duration-1000 scale-110 group-hover:scale-100" />
                  </div>
                  <div className="absolute -z-10 -top-24 -right-24 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
                </div>
              </div>

              {/* Step 4: Resolution */}
              <div className="grid lg:grid-cols-2 gap-32 items-center lg:direction-rtl">
                <div className="space-y-12 lg:order-2">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-azure-500/10 text-azure-400 font-black text-3xl border border-azure-500/20 shadow-3xl shadow-azure-500/20">
                    04
                  </div>
                  <h4 className="text-5xl font-black tracking-tighter text-azure-400">Verified Close</h4>
                  <p className="text-2xl text-slate-400 leading-relaxed font-medium">
                    Once the waste is cleared, the collector uploads photographic proof of resolution. You receive an instant confirmation and the city data is updated.
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-start gap-5 p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-azure-500/30 transition-colors">
                      <div className="w-12 h-12 bg-azure-500/10 rounded-2xl flex items-center justify-center shrink-0">
                        <CheckCircle2 className="text-azure-500 w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white mb-1">Impact Confirmed</p>
                        <p className="text-slate-400 text-sm">The report is archived and contributes to your neighborhood's overall hygiene score.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative group lg:order-1">
                  <div className="rounded-[5rem] overflow-hidden border-8 border-white/10 shadow-4xl bg-white/5 p-6 group-hover:border-azure-500/20 transition-all duration-700">
                    <img src="/pictures/Home/Sample6.jpg" alt="Field Resolution" className="rounded-[3.5rem] w-full h-auto opacity-80 group-hover:opacity-100 transition-all duration-1000 scale-110 group-hover:scale-100" />
                  </div>
                  <div className="absolute -z-10 -bottom-24 -left-24 w-[500px] h-[500px] bg-azure-500/10 rounded-full blur-[120px]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section id="impact" className="py-32 lg:py-48 relative overflow-hidden bg-white/60">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-[8rem] lg:text-[15rem] font-black tracking-[ -0.08em] text-slate-900 mb-16 leading-none select-none">
              Eco<span className="text-emerald-600">Sync.</span>
            </h2>
            <p className="text-3xl lg:text-4xl text-slate-600 mb-20 max-w-3xl mx-auto font-medium leading-tight">
              Join the movement building the world's most intelligent municipal waste infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <Link to="/register">
                <Button size="lg" className="h-24 px-16 rounded-[2.5rem] bg-slate-900 text-white text-2xl font-black hover:bg-emerald-700 shadow-4xl shadow-slate-200 hover:shadow-emerald-200 transition-all duration-700 group">
                  Start Deployment
                  <ArrowRight className="ml-4 w-10 h-10 transition-transform group-hover:translate-x-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="h-24 px-16 rounded-[2.5rem] border-slate-200 bg-white/50 backdrop-blur-xl text-slate-900 text-2xl font-black hover:bg-white transition-all duration-700">
                  Access Portal
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Decorative Footer Graphics */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-emerald-500 via-azure-500 to-slate-900" />
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-32 border-t border-emerald-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-20">
            <div className="space-y-10 max-w-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-emerald-200">
                  <Globe className="text-white w-8 h-8" />
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black tracking-tighter text-slate-900">EcoSync</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-600/60 mt-1">Sustainability Labs</span>
                </div>
              </div>
              <p className="text-xl text-slate-500 leading-relaxed font-medium">
                Pioneering the intersection of GIS intelligence and environmental logistics for the next generation of smart cities.
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-24">
              <div className="space-y-8">
                <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Platform</h5>
                <ul className="space-y-4 font-bold text-slate-600">
                  <li><a href="#" className="hover:text-emerald-600 transition-colors">Operations</a></li>
                  <li><a href="#" className="hover:text-emerald-600 transition-colors">GIS Engine</a></li>
                  <li><a href="#" className="hover:text-emerald-600 transition-colors">Compliance</a></li>
                </ul>
              </div>
              <div className="space-y-8">
                <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Labs</h5>
                <ul className="space-y-4 font-bold text-slate-600">
                  <li><a href="#" className="hover:text-emerald-600 transition-colors">Impact Data</a></li>
                  <li><a href="#" className="hover:text-emerald-600 transition-colors">AI Research</a></li>
                  <li><a href="#" className="hover:text-emerald-600 transition-colors">Open Source</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-32 pt-12 border-t border-emerald-50 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
              © 2026 EcoSync Systems. Built for Smart Cities.
            </p>
            
            <div className="flex items-center gap-8">
              {[Activity, Zap, Shield, Layers].map((Icon, i) => (
                <a key={i} href="#" className="w-16 h-16 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-4xl hover:shadow-emerald-500/5 transition-all duration-500">
                  <Icon size={24} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
