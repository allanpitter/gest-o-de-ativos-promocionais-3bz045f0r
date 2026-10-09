import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { incidentService, pdvService, assetService } from '@/services/api'
import type { Incident, PDV, Asset } from '@/types'
import {
  AlertTriangle,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  X,
  Camera,
  Layers,
  MapPin,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Incidents() {
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('id')
  const { toast } = useToast()

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [pdvs, setPdvs] = useState<PDV[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [pdvFilter, setPdvFilter] = useState('ALL')

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailModalIncident, setDetailModalIncident] = useState<Incident | null>(null)
  const [resolveNotes, setResolveNotes] = useState('')
  const [resolving, setResolving] = useState(false)

  // New Incident form
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<any>('Ruptura')
  const [newSeverity, setNewSeverity] = useState<any>('Alta')
  const [newPdvId, setNewPdvId] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      const [incRes, pList, aRes] = await Promise.all([
        incidentService.getAll({ perPage: 100 }),
        pdvService.getAll(),
        assetService.getAll({ perPage: 100 }),
      ])
      setIncidents(incRes.items)
      setPdvs(pList)
      setAssets(aRes.items)
      if (pList.length > 0) setNewPdvId(pList[0].id)

      if (highlightId) {
        const found = incRes.items.find((i) => i.id === highlightId)
        if (found) setDetailModalIncident(found)
      }
    } catch {
      /* intentionally ignored */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [highlightId])

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await incidentService.create({
        title: newTitle,
        type: newType,
        severity: newSeverity,
        status: 'Aberta',
        pdv_id: newPdvId,
        description: newDescription,
      })
      toast({ title: 'Ocorrência registrada com sucesso!' })
      setCreateModalOpen(false)
      setNewTitle('')
      setNewDescription('')
      await loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar ocorrência',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const handleResolveIncident = async () => {
    if (!detailModalIncident) return
    try {
      setResolving(true)
      const nowStr = new Date().toISOString()
      await incidentService.update(detailModalIncident.id, {
        status: 'Resolvida',
        resolution_notes: resolveNotes || 'Ocorrência resolvida pelo gestor com ação corretiva.',
        resolved_at: nowStr,
      })
      toast({ title: 'Ocorrência marcada como Resolvida!' })
      setDetailModalIncident(null)
      setResolveNotes('')
      await loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao resolver ocorrência',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setResolving(false)
    }
  }

  const filteredIncidents = incidents.filter((i) => {
    const matchStatus = statusFilter === 'ALL' || i.status === statusFilter
    const matchSev = severityFilter === 'ALL' || i.severity === severityFilter
    const matchPdv = pdvFilter === 'ALL' || i.pdv_id === pdvFilter
    return matchStatus && matchSev && matchPdv
  })

  const getSeverityBadge = (sev?: string) => {
    switch (sev) {
      case 'Critica':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700">
            Crítica
          </span>
        )
      case 'Alta':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-700">
            Alta
          </span>
        )
      case 'Media':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700">
            Média
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
            Baixa
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestão de Ocorrências & Alertas
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Rastreio de rupturas, avarias em materiais de PDV e não conformidades de execução
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#FF6D00] text-white hover:bg-[#e06000] shadow-[0_4px_16px_rgba(255,109,0,0.3)] flex items-center gap-2 transition-all hover:-translate-y-0.5"
        >
          <Plus size={16} /> + Registrar Ocorrência
        </button>
      </div>

      {/* Early Warning Banner for automatic checklist negative items */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black">Mecanismo de Alertas Antecipados Ativo</h4>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Qualquer item de checklist negativo apontado por promotores em visita gera ocorrência
              instantânea e notifica gestores.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-amber-200/60 text-amber-900">
          Automação Ativa
        </span>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <span className="font-bold text-slate-700">Filtros:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700"
        >
          <option value="ALL">Todos os Status</option>
          <option value="Aberta">Aberta</option>
          <option value="Em analise">Em análise</option>
          <option value="Resolvida">Resolvida</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700"
        >
          <option value="ALL">Todas Severidades</option>
          <option value="Critica">Crítica</option>
          <option value="Alta">Alta</option>
          <option value="Media">Média</option>
          <option value="Baixa">Baixa</option>
        </select>

        <select
          value={pdvFilter}
          onChange={(e) => setPdvFilter(e.target.value)}
          className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700"
        >
          <option value="ALL">Todos os PDVs</option>
          {pdvs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="ml-auto text-slate-400 font-medium">
          {filteredIncidents.length} ocorrências listadas
        </div>
      </div>

      {/* Incidents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredIncidents.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Nenhuma ocorrência encontrada com os filtros selecionados.
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const pdv = pdvs.find((p) => p.id === inc.pdv_id)

            return (
              <div
                key={inc.id}
                onClick={() => setDetailModalIncident(inc)}
                className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {inc.type || 'Ocorrência'}
                    </span>
                    {getSeverityBadge(inc.severity)}
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#FF6D00] transition-colors line-clamp-2">
                    {inc.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {inc.description || 'Não conformidade registrada em auditoria de PDV.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[180px] flex items-center gap-1 font-semibold text-slate-700">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    {pdv ? pdv.name : 'PDV'}
                  </span>
                  <span className="text-[#00C853] font-bold group-hover:underline">
                    {inc.status === 'Resolvida' ? 'Ver Solução' : 'Resolver →'}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Incident Detail / Resolve Modal */}
      {detailModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  {getSeverityBadge(detailModalIncident.severity)}
                  <span className="text-[10px] font-bold text-slate-400">
                    Status: {detailModalIncident.status}
                  </span>
                </div>
                <h3 className="font-black text-base text-slate-900 mt-1">
                  {detailModalIncident.title}
                </h3>
              </div>
              <button
                onClick={() => setDetailModalIncident(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px]">
                  PDV Impactado
                </span>
                <p className="text-slate-900 font-bold mt-0.5">
                  {pdvs.find((p) => p.id === detailModalIncident.pdv_id)?.name}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px]">
                  Descrição do Problema
                </span>
                <p className="text-slate-700 mt-0.5 p-3 rounded-xl bg-slate-50 border border-slate-200 leading-relaxed">
                  {detailModalIncident.description}
                </p>
              </div>

              {detailModalIncident.status === 'Resolvida' ? (
                <div>
                  <span className="font-bold text-emerald-600 uppercase text-[10px]">
                    Solução Aplicada
                  </span>
                  <p className="text-emerald-900 mt-0.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 leading-relaxed">
                    {detailModalIncident.resolution_notes ||
                      'Resolvida com alinhamento e reposição.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Observações de Resolução / Ação Tomada
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva como a ocorrência foi solucionada (ex: material substituído, estoque abastecido)..."
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00C853]"
                  />
                  <button
                    onClick={handleResolveIncident}
                    disabled={resolving}
                    className="w-full py-2.5 px-4 bg-[#00C853] text-white font-bold text-xs rounded-xl hover:bg-[#00A844] shadow-md disabled:opacity-50"
                  >
                    {resolving ? 'Salvando...' : 'Marcar como Resolvida'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Incident Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Registrar Nova Ocorrência</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Título da Ocorrência
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ruptura detectada na linha premium"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tipo</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Ruptura">Ruptura</option>
                    <option value="Material danificado">Material danificado</option>
                    <option value="Queda de estrutura">Queda de estrutura</option>
                    <option value="PDV nao executado">PDV não executado</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Severidade</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Media">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Critica">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  PDV de Ocorrência
                </label>
                <select
                  value={newPdvId}
                  onChange={(e) => setNewPdvId(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {pdvs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Descrição Detalhada
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Relate o motivo, impacto nas vendas e ação preventiva tomada..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#FF6D00] text-white hover:bg-[#e06000] shadow-md"
                >
                  Salvar Ocorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
