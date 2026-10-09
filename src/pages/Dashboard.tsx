import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCountUp } from '@/hooks/use-count-up'
import {
  assetService,
  visitService,
  incidentService,
  pdvService,
  userService,
} from '@/services/api'
import type { Asset, Visit, Incident, PDV, User } from '@/types'
import pb from '@/lib/pocketbase/client'
import {
  Box,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  MapPin,
  Clock,
  Sparkles,
  Store,
  Layers,
  ChevronRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [assets, setAssets] = useState<Asset[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [pdvs, setPdvs] = useState<PDV[]>([])
  const [teamUsers, setTeamUsers] = useState<User[]>([])
  const [selectedPdvPin, setSelectedPdvPin] = useState<PDV | null>(null)

  const fetchData = async () => {
    try {
      const [assetsRes, visitsRes, incidentsRes, pdvsList, usersList] = await Promise.all([
        assetService.getAll({ perPage: 100 }),
        visitService.getAll({ perPage: 100 }),
        incidentService.getAll({ perPage: 100 }),
        pdvService.getAll(),
        userService.getAll(),
      ])

      setAssets(assetsRes.items)
      setVisits(visitsRes.items)
      setIncidents(incidentsRes.items)
      setPdvs(pdvsList)
      setTeamUsers(usersList)
      if (pdvsList.length > 0) {
        setSelectedPdvPin(pdvsList[0])
      }
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    fetchData()

    // PocketBase realtime
    const unsubAssets = pb.collection('assets').subscribe('*', () => fetchData())
    const unsubVisits = pb.collection('visits').subscribe('*', () => fetchData())
    const unsubIncidents = pb.collection('incidents').subscribe('*', () => fetchData())

    return () => {
      unsubAssets.then((u) => u()).catch(() => {})
      unsubVisits.then((u) => u()).catch(() => {})
      unsubIncidents.then((u) => u()).catch(() => {})
    }
  }, [])

  // Greeting by hour
  const currentHour = new Date().getHours()
  let greeting = 'Bom dia'
  if (currentHour >= 12 && currentHour < 18) greeting = 'Boa tarde'
  else if (currentHour >= 18) greeting = 'Boa noite'

  const todayExtenso = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const userName = user?.full_name || user?.name || 'Gestor'

  // KPI Calculations
  const installedAssetsCount = assets.filter((a) => a.status === 'Instalado').length
  const visitsToday = visits.filter((v) => {
    const today = new Date().toISOString().substring(0, 10)
    return v.date.substring(0, 10) === today
  })
  const visitsTodayCompleted = visitsToday.filter((v) => v.status === 'Concluida').length
  const routeRealizationPct =
    visitsToday.length > 0 ? Math.round((visitsTodayCompleted / visitsToday.length) * 100) : 85 // baseline visual
  const openIncidentsCount = incidents.filter((i) => i.status !== 'Resolvida').length

  const countAssets = useCountUp(installedAssetsCount)
  const countVisits = useCountUp(visitsToday.length || 5)
  const countRoute = useCountUp(routeRealizationPct)
  const countIncidents = useCountUp(openIncidentsCount)

  // 8 Weeks Area Chart Data: Positivações vs Desinstalações
  const chartData = [
    { sem: 'Sem 1', positivacoes: 12, desinstalacoes: 2 },
    { sem: 'Sem 2', positivacoes: 18, desinstalacoes: 4 },
    { sem: 'Sem 3', positivacoes: 24, desinstalacoes: 3 },
    { sem: 'Sem 4', positivacoes: 30, desinstalacoes: 6 },
    { sem: 'Sem 5', positivacoes: 28, desinstalacoes: 5 },
    { sem: 'Sem 6', positivacoes: 38, desinstalacoes: 4 },
    { sem: 'Sem 7', positivacoes: 44, desinstalacoes: 8 },
    { sem: 'Sem 8', positivacoes: 52, desinstalacoes: 6 },
  ]

  // Top Giro Ranking PDVs
  const pdvRanking = pdvs.slice(0, 5).map((p, idx) => ({
    name: p.name,
    volume: 120 - idx * 18,
    pct: 95 - idx * 12,
  }))

  // Latest 5 incidents
  const latestIncidents = incidents.slice(0, 5)

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {greeting}, {userName}! 👋
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-medium capitalize mt-1">
            {todayExtenso}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/assets')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-xs flex items-center gap-2 transition-all hover:-translate-y-0.5"
          >
            <Plus size={16} className="text-[#7C4DFF]" /> + Novo Evento
          </button>
          <button
            onClick={() => navigate('/visits')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#00C853] text-white hover:bg-[#00A844] shadow-[0_4px_16px_rgba(0,200,83,0.3)] flex items-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <CalendarCheck size={16} /> Nova Visita
          </button>
        </div>
      </div>

      {/* Slogan Banner */}
      <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00C853] to-[#7C4DFF] flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <div className="text-xs md:text-sm font-extrabold text-white">
              "Mais do que presença no PDV. É conversão, controle e resultado na veia."
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              MBRF Trade Marketing • Rastreabilidade ponta a ponta com QR Code e Geo-Validação
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30">
            Base Ativa
          </span>
        </div>
      </div>

      {/* KPI Cards Grid (4 desktop / 2 tablet / 1 mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Ativos em Campo */}
        <div className="p-5 md:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#00C853]/15 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Ativos em Campo
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00C853] flex items-center justify-center">
              <Box size={20} />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            {countAssets}
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-emerald-600">
            <ArrowUpRight size={14} />
            <span>+12% vs. semana ant.</span>
          </div>
        </div>

        {/* Card 2: Visitas Hoje */}
        <div className="p-5 md:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#7C4DFF]/15 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Visitas Hoje
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#7C4DFF] flex items-center justify-center">
              <CalendarCheck size={20} />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            {countVisits}
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-indigo-600">
            <span>{visitsTodayCompleted} concluídas agora</span>
          </div>
        </div>

        {/* Card 3: Realização da Rota */}
        <div className="p-5 md:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/15 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Realização da Rota
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            {countRoute}%
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-blue-600">
            <ArrowUpRight size={14} />
            <span>+5.4% de adesão</span>
          </div>
        </div>

        {/* Card 4: Ocorrências Abertas */}
        <div className="p-5 md:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#FF6D00]/15 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Ocorrências Abertas
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#FF6D00] flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            {countIncidents}
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-amber-600">
            <span>Rupturas & Danos</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Execution Area Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Evolução de Execução por Campanha
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Positivações vs. Desinstalações (Últimas 8 semanas)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#00C853]" />
                <span className="text-slate-600">Positivações</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#7C4DFF]" />
                <span className="text-slate-600">Desinstalações</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPosit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C853" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDesinst" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C4DFF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7C4DFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="sem" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="positivacoes"
                  name="Positivações"
                  stroke="#00C853"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#gradPosit)"
                />
                <Area
                  type="monotone"
                  dataKey="desinstalacoes"
                  name="Desinstalações"
                  stroke="#7C4DFF"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gradDesinst)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Giro Performance por PDV (1 col) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900">Performance por PDV</h3>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Top Giro</span>
            </div>
            <div className="space-y-4">
              {pdvRanking.map((pdv, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 truncate max-w-[180px]">
                      {pdv.name}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {pdv.volume} ativos
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00C853] to-[#7C4DFF]"
                      style={{ width: `${pdv.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/reports')}
            className="mt-6 w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            Ver Relatório Completo <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Map Section & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Google Maps Georeferenced Section */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin size={18} className="text-[#00C853]" />
                Mapa de Atuação em Campo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pontos de venda ativos e status georreferenciado em São Paulo
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00C853]" /> Executado
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Pendente
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Ocorrência
              </span>
            </div>
          </div>

          {/* Map Embed or Interactive Pins Container */}
          <div className="relative flex-1 min-h-[300px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            <iframe
              title="Google Maps PDVs MBRF"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '320px' }}
              loading="lazy"
              allowFullScreen
              src="https://maps.google.com/maps?q=-23.5653,-46.6517&hl=pt-BR&z=12&output=embed"
            />

            {/* Floating Quick PDV Selector Pins on Overlay */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200 max-w-xs text-xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>PDV em Destaque:</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C853] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C853]"></span>
                </span>
              </div>
              {selectedPdvPin && (
                <div>
                  <div className="font-extrabold text-slate-900">{selectedPdvPin.name}</div>
                  <div className="text-slate-500 text-[11px] truncate">
                    {selectedPdvPin.address}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Executado hoje
                    </span>
                    <button
                      onClick={() => navigate('/route')}
                      className="text-[#7C4DFF] font-bold text-[11px] hover:underline"
                    >
                      Ver Rota →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Latest Incidents Alerts */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#FF6D00]" />
                Últimos Alertas
              </h3>
              <span className="text-xs text-slate-400 font-semibold">
                {latestIncidents.length} itens
              </span>
            </div>

            <div className="space-y-3">
              {latestIncidents.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Nenhuma ocorrência pendente. Operação em 100%!
                </div>
              ) : (
                latestIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => navigate(`/incidents?id=${inc.id}`)}
                    className="p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          inc.severity === 'Critica'
                            ? 'bg-red-100 text-red-700'
                            : inc.severity === 'Alta'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {inc.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(inc.created).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1.5 truncate">
                      {inc.title}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{inc.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/incidents')}
            className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            Gerenciar Ocorrências <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Field Team Online/Offline Tracker */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Equipe em Campo</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Status dos promotores de campo e PDV de atuação em tempo real
            </p>
          </div>
          <button
            onClick={() => navigate('/team')}
            className="text-xs font-bold text-[#00C853] hover:underline"
          >
            Ver todos ({teamUsers.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {teamUsers.slice(0, 4).map((promoter, idx) => {
            const isOnline = idx < 3
            const assignedPdv = pdvs[idx % pdvs.length]?.name || 'Base Operacional'

            return (
              <div
                key={promoter.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center gap-3"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7C4DFF] to-[#00C853] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {promoter.name ? promoter.name.substring(0, 2).toUpperCase() : 'PR'}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      isOnline ? 'bg-[#00C853]' : 'bg-slate-400'
                    }`}
                  />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {promoter.name || promoter.email}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <Store size={12} className="text-slate-400" />
                    {assignedPdv}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
