import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard,
  Box,
  CalendarCheck,
  Megaphone,
  AlertTriangle,
  Route,
  FileBarChart2,
  Users,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ExternalLink,
  Phone,
  Mail,
  CheckCircle2,
  Sliders,
  LifeBuoy,
} from 'lucide-react'
import { notificationService, assetService, pdvService, incidentService } from '@/services/api'
import type { Notification, Asset, PDV, Incident } from '@/types'
import pb from '@/lib/pocketbase/client'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)

  // Global search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<{
    assets: Asset[]
    pdvs: PDV[]
    incidents: Incident[]
  }>({ assets: [], pdvs: [], incidents: [] })

  const searchRef = useRef<HTMLDivElement>(null)

  // Load notifications
  useEffect(() => {
    if (!user) return
    const fetchNotifs = async () => {
      try {
        const res = await notificationService.getAll(user.id)
        setNotifications(res.items)
        setUnreadCount(res.items.filter((n) => !n.read).length)
      } catch {
        /* intentionally ignored */
      }
    }
    fetchNotifs()

    // PocketBase realtime subscription for notifications
    const unsub = pb.collection('notifications').subscribe('*', (e) => {
      if (e.action === 'create' || e.action === 'update') {
        fetchNotifs()
      }
    })

    return () => {
      unsub.then((u) => u()).catch(() => {})
    }
  }, [user])

  // Handle outside click for search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Global search debounce
  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 2) {
      setSearchResults({ assets: [], pdvs: [], incidents: [] })
      setSearchOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const [assetRes, pdvList, incidentRes] = await Promise.all([
          assetService.getAll({ filter: `name ~ '${q}' || qr_code ~ '${q}'`, perPage: 4 }),
          pdvService.getAll(),
          incidentService.getAll({ filter: `title ~ '${q}'`, perPage: 4 }),
        ])

        const filteredPdvs = pdvList
          .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 4)

        setSearchResults({
          assets: assetRes.items,
          pdvs: filteredPdvs,
          incidents: incidentRes.items,
        })
        setSearchOpen(true)
      } catch {
        /* intentionally ignored */
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleMarkAsRead = async (notif: Notification) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif.id)
        setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {
        /* intentionally ignored */
      }
    }
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    try {
      await notificationService.markAllAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      /* intentionally ignored */
    }
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Ativos', path: '/assets', icon: Box },
    { label: 'Visitas', path: '/visits', icon: CalendarCheck },
    { label: 'Campanhas', path: '/campaigns', icon: Megaphone },
    { label: 'Ocorrências', path: '/incidents', icon: AlertTriangle },
    { label: 'Rota', path: '/route', icon: Route },
    { label: 'Relatórios', path: '/reports', icon: FileBarChart2 },
    { label: 'Equipe', path: '/team', icon: Users },
  ]

  const userRole = user?.role || 'Gestor'
  const userName = user?.full_name || user?.name || user?.email?.split('@')[0] || 'Usuário'
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A] font-sans antialiased">
      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar (Desktop fixed 260px, Mobile drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-[260px] bg-[#0F172A] text-[#94A3B8] z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 border-r border-[#1E293B] shadow-2xl md:shadow-none ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00C853] to-[#00A844] flex items-center justify-center text-white font-extrabold text-lg shadow-[0_0_15px_rgba(0,200,83,0.35)]">
                P
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-black tracking-wider text-lg">PROFILE</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#7C4DFF]/30 text-[#A78BFA] border border-[#7C4DFF]/40">
                    MBRF
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] font-medium leading-none mt-0.5">
                  Gestão de Ativos Promocionais
                </p>
              </div>
            </div>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="md:hidden text-[#94A3B8] hover:text-white p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-[#1E293B] text-white shadow-sm'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/50 hover:translate-x-1'
                  }`}
                >
                  {/* Left indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#00C853] rounded-r-full shadow-[0_0_8px_#00C853]" />
                  )}
                  <Icon
                    size={19}
                    className={`transition-colors ${isActive ? 'text-[#00C853]' : 'text-[#64748B] group-hover:text-[#94A3B8]'}`}
                  />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Footer / User Profile Card */}
        <div className="p-4 border-t border-[#1E293B]">
          <div className="p-3 rounded-xl bg-[#1E293B]/70 border border-[#334155]/50 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#7C4DFF] to-[#00C853] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow">
                {userInitials}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{userName}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${userRole === 'Gestor' ? 'bg-[#00C853]' : 'bg-[#38BDF8]'}`}
                  />
                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wide font-semibold">
                    {userRole}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sair"
              className="text-[#94A3B8] hover:text-[#EF4444] p-1.5 rounded-lg hover:bg-[#0F172A] transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#64748B] px-1">
            <button
              onClick={() => navigate('/settings')}
              className="hover:text-[#94A3B8] transition-colors flex items-center gap-1"
            >
              <Sliders size={12} /> Configurações
            </button>
            <span>•</span>
            <button
              onClick={() =>
                alert('Suporte MBRF: kaue.mello@profilelog.com.br | Tel: +55 11 97725-0863')
              }
              className="hover:text-[#94A3B8] transition-colors flex items-center gap-1"
            >
              <LifeBuoy size={12} /> Suporte
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header (64px) with blur and sticky behavior */}
        <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-md border-b border-[#E2E8F0] px-4 md:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger & live indicator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden text-[#0F172A] p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>

            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C853] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C853]"></span>
              </span>
              <span className="text-[11px] font-extrabold text-[#00A844] tracking-wider">
                AO VIVO
              </span>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-md relative" ref={searchRef}>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar por ativo, PDV, promotor, QR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setSearchOpen(true)
                }}
                className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-slate-100/80 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00C853] focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Live Search Results Dropdown */}
            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 max-h-96 overflow-y-auto">
                {searchResults.assets.length === 0 &&
                searchResults.pdvs.length === 0 &&
                searchResults.incidents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Nenhum resultado encontrado para "{searchQuery}"
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Ativos */}
                    {searchResults.assets.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                          Ativos Promocionais
                        </div>
                        {searchResults.assets.map((asset) => (
                          <div
                            key={asset.id}
                            onClick={() => {
                              setSearchOpen(false)
                              navigate(`/assets?asset=${asset.id}`)
                            }}
                            className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Box size={15} className="text-[#00C853]" />
                              <div>
                                <span className="font-semibold text-slate-800">{asset.name}</span>
                                <span className="ml-2 font-mono text-[11px] text-slate-500">
                                  [{asset.qr_code}]
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                              {asset.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* PDVs */}
                    {searchResults.pdvs.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                          Pontos de Venda (PDVs)
                        </div>
                        {searchResults.pdvs.map((pdv) => (
                          <div
                            key={pdv.id}
                            onClick={() => {
                              setSearchOpen(false)
                              navigate(`/route?pdv=${pdv.id}`)
                            }}
                            className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Route size={15} className="text-[#7C4DFF]" />
                              <span className="font-semibold text-slate-800">{pdv.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {pdv.address}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ocorrências */}
                    {searchResults.incidents.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                          Ocorrências
                        </div>
                        {searchResults.incidents.map((inc) => (
                          <div
                            key={inc.id}
                            onClick={() => {
                              setSearchOpen(false)
                              navigate(`/incidents?id=${inc.id}`)
                            }}
                            className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <AlertTriangle size={15} className="text-[#FF6D00]" />
                              <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                                {inc.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-600">
                              {inc.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Notifications & Avatar */}
          <div className="flex items-center gap-3">
            {/* Notification button */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Notificações"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Mini Avatar Header */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00C853] to-[#7C4DFF] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {userInitials}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold leading-none text-slate-800">{userName}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{userRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/60 py-4 px-6 md:px-8 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-700">
              © 2025 MBRF — Profile Trade Marketing
            </span>
            <span className="ml-2 text-slate-400">v1.2.0 • Zero-Touch Connected</span>
          </div>
          <div className="flex items-center flex-wrap gap-4 text-slate-500">
            <a
              href="https://www.profilelog.com.br"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#00C853] flex items-center gap-1 transition-colors"
            >
              <ExternalLink size={12} /> www.profilelog.com.br
            </a>
            <span className="hidden sm:inline">•</span>
            <a
              href="mailto:kaue.mello@profilelog.com.br"
              className="hover:text-[#00C853] flex items-center gap-1 transition-colors"
            >
              <Mail size={12} /> kaue.mello@profilelog.com.br
            </a>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1 text-slate-600">
              <Phone size={12} /> +55 11 97725-0863
            </span>
          </div>
        </footer>
      </div>

      {/* Notifications Slide-over Panel */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setNotificationsOpen(false)}
            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-xs transition-opacity"
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-left">
              {/* Notif Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-[#00C853]" />
                  <h3 className="font-bold text-slate-800 text-base">Notificações</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                      {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#00C853] hover:underline font-semibold"
                    >
                      Ler todas
                    </button>
                  )}
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Notif List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <CheckCircle2 size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Você não tem notificações.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkAsRead(notif)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        notif.read
                          ? 'bg-white border-slate-200/80 opacity-75'
                          : 'bg-emerald-50/40 border-emerald-200 shadow-xs'
                      } hover:border-[#00C853]`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              notif.type === 'Incident'
                                ? 'bg-[#FF6D00]'
                                : notif.type === 'Asset'
                                  ? 'bg-[#7C4DFF]'
                                  : 'bg-[#00C853]'
                            }`}
                          />
                          <h4 className="text-xs font-bold text-slate-800">{notif.title}</h4>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(notif.created).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 pl-4 leading-relaxed">
                        {notif.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
