import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { pdvService, routeService, userService } from '@/services/api'
import type { PDV, User } from '@/types'
import {
  Route as RouteIcon,
  MapPin,
  Calendar,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function RoutePage() {
  const [searchParams] = useSearchParams()
  const highlightedPdvId = searchParams.get('pdv')
  const promoterParam = searchParams.get('promoter')
  const { user } = useAuth()
  const { toast } = useToast()

  const [pdvs, setPdvs] = useState<PDV[]>([])
  const [promoters, setPromoters] = useState<User[]>([])
  const [selectedPromoterId, setSelectedPromoterId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().substring(0, 10),
  )

  // Sequence of PDVs for the route
  const [routePdvIds, setRoutePdvIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    try {
      const [pdvList, usersList] = await Promise.all([pdvService.getAll(), userService.getAll()])
      setPdvs(pdvList)

      const proms = usersList.filter((u) => u.role === 'Promotor' || u.role === 'Gestor')
      setPromoters(proms)

      const targetPromId = promoterParam || user?.id || proms[0]?.id || ''
      setSelectedPromoterId(targetPromId)

      // Try load existing route plan
      const existing = await routeService.getForDateAndPromoter(selectedDate, targetPromId)
      if (existing && existing.pdv_ids) {
        try {
          const ids =
            typeof existing.pdv_ids === 'string' ? JSON.parse(existing.pdv_ids) : existing.pdv_ids
          if (Array.isArray(ids) && ids.length > 0) {
            setRoutePdvIds(ids)
            return
          }
        } catch {
          /* intentionally ignored */
        }
      }

      // Default first 4 PDVs
      const defaultIds = pdvList.slice(0, 4).map((p) => p.id)
      setRoutePdvIds(defaultIds)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedDate, promoterParam])

  // Nearest Neighbor TSP Route Optimization
  const handleOptimizeRoute = () => {
    if (routePdvIds.length < 2) {
      toast({ title: 'A rota já está simplificada.' })
      return
    }

    const currentPdvs = routePdvIds
      .map((id) => pdvs.find((p) => p.id === id))
      .filter((p): p is PDV => !!p)

    // Greedy Nearest Neighbor
    const unvisited = [...currentPdvs]
    const optimized: PDV[] = []
    let current = unvisited.shift()!
    optimized.push(current)

    const getCoord = (p: PDV) => {
      try {
        const c = typeof p.coordinates === 'string' ? JSON.parse(p.coordinates) : p.coordinates
        return c || { lat: -23.55, lng: -46.63 }
      } catch (_) {
        return { lat: -23.55, lng: -46.63 }
      }
    }

    while (unvisited.length > 0) {
      const currCoord = getCoord(current)
      let nearestIdx = 0
      let minDistance = Infinity

      for (let i = 0; i < unvisited.length; i++) {
        const candCoord = getCoord(unvisited[i])
        const dist = Math.hypot(currCoord.lat - candCoord.lat, currCoord.lng - candCoord.lng)
        if (dist < minDistance) {
          minDistance = dist
          nearestIdx = i
        }
      }

      current = unvisited.splice(nearestIdx, 1)[0]
      optimized.push(current)
    }

    const newIds = optimized.map((p) => p.id)
    setRoutePdvIds(newIds)
    toast({
      title: 'Rota Otimizada com Sucesso!',
      description:
        'Calculado pelo algoritmo de vizinho mais próximo pelas coordenadas geográficas.',
    })
  }

  const handleSaveRoutePlan = async () => {
    if (!selectedPromoterId) return
    try {
      setSaving(true)
      await routeService.saveRoute({
        date: `${selectedDate} 08:00:00.000Z`,
        promoter_id: selectedPromoterId,
        pdv_ids: routePdvIds,
      })
      toast({
        title: 'Planejamento de Rota Salvo!',
        description: 'Promotor notificado com o novo trajeto.',
      })
    } catch (err: any) {
      toast({ title: 'Erro ao salvar rota', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Reorder helper
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= routePdvIds.length) return
    const copy = [...routePdvIds]
    const temp = copy[index]
    copy[index] = copy[targetIndex]
    copy[targetIndex] = temp
    setRoutePdvIds(copy)
  }

  const orderedPdvs = routePdvIds
    .map((id) => pdvs.find((p) => p.id === id))
    .filter((p): p is PDV => !!p)

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Roteirização Inteligente do Dia
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Sequenciamento otimizado de visitas e trajeto poligonal georreferenciado
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOptimizeRoute}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-2 transition-transform active:scale-95"
          >
            <Sparkles size={16} className="text-[#00C853]" /> Otimizar Rota (Menor Caminho)
          </button>
          <button
            onClick={handleSaveRoutePlan}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#00C853] text-white hover:bg-[#00A844] shadow-[0_4px_16px_rgba(0,200,83,0.3)] flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Rota'}
          </button>
        </div>
      </div>

      {/* Control Bar: Date & Promoter Selection */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-slate-400" />
          <span className="font-bold text-slate-700">Data da Rota:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="py-1 px-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
          />
        </div>

        {user?.role === 'Gestor' && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Promotor Atribuído:</span>
            <select
              value={selectedPromoterId}
              onChange={(e) => setSelectedPromoterId(e.target.value)}
              className="py-1 px-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
            >
              {promoters.map((prom) => (
                <option key={prom.id} value={prom.id}>
                  {prom.name || prom.email} ({prom.role})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="ml-auto text-slate-500 font-medium">
          {orderedPdvs.length} PDVs no roteiro selecionado
        </div>
      </div>

      {/* Main Grid: Interactive Map + Ordered PDV List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View with route line simulation */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <RouteIcon size={18} className="text-[#00C853]" />
                Trajeto Mapeado (São Paulo / SP)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pins numerados indicam a sequência recomendada de parada
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Trajeto Ativo
            </span>
          </div>

          <div className="relative flex-1 min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
            <iframe
              title="Mapa de Roteirização MBRF"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '420px' }}
              loading="lazy"
              src="https://maps.google.com/maps?q=-23.5653,-46.6517&hl=pt-BR&z=13&output=embed"
            />

            {/* Float Overlay Sequence */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 flex items-center justify-between gap-3 overflow-x-auto text-xs">
              <span className="font-bold text-slate-800 shrink-0">Sequência:</span>
              <div className="flex items-center gap-2 shrink-0">
                {orderedPdvs.map((pdv, i) => (
                  <div key={pdv.id} className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#00C853] text-white font-extrabold text-[10px] flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[100px]">
                      {pdv.name.split('—')[1]?.trim() || pdv.name}
                    </span>
                    {i < orderedPdvs.length - 1 && <span className="text-slate-300">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ordered PDVs Sequencer */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Pontos de Parada</h3>
              <span className="text-[11px] text-slate-400 font-semibold">Ordem de Visita</span>
            </div>

            <div className="space-y-3">
              {orderedPdvs.map((pdv, idx) => {
                const isVisited = idx === 0

                return (
                  <div
                    key={pdv.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      highlightedPdvId === pdv.id
                        ? 'border-[#00C853] bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-xl bg-[#0F172A] text-white font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{pdv.name}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[160px] mt-0.5">
                            {pdv.address}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          isVisited
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isVisited ? 'Visitado' : 'Pendente'}
                      </span>
                    </div>

                    {/* Manual reorder buttons */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Parada #{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, 'up')}
                          className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold hover:bg-slate-100 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={idx === orderedPdvs.length - 1}
                          onClick={() => handleMove(idx, 'down')}
                          className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold hover:bg-slate-100 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            Promotor recebe a notificação da rota instantaneamente no dispositivo.
          </div>
        </div>
      </div>
    </div>
  )
}
