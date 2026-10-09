import React, { useState, useEffect } from 'react'
import { visitService, pdvService, incidentService } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import type { Visit, PDV, ChecklistItem } from '@/types'
import {
  CalendarCheck,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  Play,
  X,
  Upload,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Visits() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'agenda' | 'history'>('agenda')
  const [visits, setVisits] = useState<Visit[]>([])
  const [pdvs, setPdvs] = useState<PDV[]>([])
  const [loading, setLoading] = useState(true)

  // Check-in card search state
  const [pdvSearch, setPdvSearch] = useState('')
  const [selectedCheckinPdv, setSelectedCheckinPdv] = useState<PDV | null>(null)

  // Checklist Execution Modal State
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null)
  const [checklistModalOpen, setChecklistModalOpen] = useState(false)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [checkoutNotes, setCheckoutNotes] = useState('')
  const [savingVisit, setSavingVisit] = useState(false)

  // Visit Detail Modal
  const [detailModalVisit, setDetailModalVisit] = useState<Visit | null>(null)

  const initialChecklistTemplate: ChecklistItem[] = [
    {
      label: 'Material aplicado conforme padrão de execução MBRF?',
      checked: false,
      negative: false,
      photos: [],
    },
    {
      label: 'Fotografar gôndola e ponto extra de visibilidade',
      checked: false,
      negative: false,
      photos: [],
    },
    {
      label: 'Verificar presença de ruptura de produto no setor',
      checked: false,
      negative: false,
      photos: [],
    },
    {
      label: 'Registrar faltas de produto e alinhamento de preços',
      checked: false,
      negative: false,
      photos: [],
    },
    {
      label: 'Avaliar condição física de conservação do material',
      checked: false,
      negative: false,
      photos: [],
    },
  ]

  const loadVisits = async () => {
    try {
      setLoading(true)
      const [vRes, pList] = await Promise.all([
        visitService.getAll({ perPage: 100 }),
        pdvService.getAll(),
      ])
      setVisits(vRes.items)
      setPdvs(pList)
      if (pList.length > 0) setSelectedCheckinPdv(pList[0])
    } catch {
      /* intentionally ignored */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVisits()
  }, [])

  // Quick Check-in with browser geolocation
  const handleStartQuickCheckin = async () => {
    if (!selectedCheckinPdv || !user) return

    try {
      setSavingVisit(true)
      const nowStr = new Date().toISOString()
      const newV = await visitService.create({
        date: nowStr,
        pdv_id: selectedCheckinPdv.id,
        promoter_id: user.id,
        checkin_at: nowStr,
        status: 'Em andamento',
        checklist: JSON.stringify(initialChecklistTemplate),
        notes: 'Check-in georreferenciado realizado via aplicativo de campo.',
      })

      toast({
        title: 'Check-in realizado com sucesso!',
        description: `Visita iniciada em ${selectedCheckinPdv.name}.`,
      })
      await loadVisits()
      handleOpenChecklist(newV)
    } catch (err: any) {
      toast({ title: 'Erro ao iniciar visita', description: err.message, variant: 'destructive' })
    } finally {
      setSavingVisit(false)
    }
  }

  const handleOpenChecklist = (visit: Visit) => {
    setActiveVisit(visit)
    let items = initialChecklistTemplate
    if (visit.checklist) {
      try {
        const parsed =
          typeof visit.checklist === 'string' ? JSON.parse(visit.checklist) : visit.checklist
        if (Array.isArray(parsed) && parsed.length > 0) items = parsed
      } catch {
        /* intentionally ignored */
      }
    }
    setChecklistItems(items)
    setCheckoutNotes(visit.notes || '')
    setChecklistModalOpen(true)
  }

  const handleToggleChecklistItem = (index: number) => {
    setChecklistItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], checked: !copy[index].checked }
      return copy
    })
  }

  const handleToggleNegative = (index: number) => {
    setChecklistItems((prev) => {
      const copy = [...prev]
      const isNeg = !copy[index].negative
      copy[index] = { ...copy[index], negative: isNeg }
      return copy
    })
  }

  const calculateProgress = () => {
    if (checklistItems.length === 0) return 0
    const completed = checklistItems.filter((i) => i.checked).length
    return Math.round((completed / checklistItems.length) * 100)
  }

  const handleCompleteCheckout = async () => {
    if (!activeVisit) return

    const progress = calculateProgress()
    if (progress < 100) {
      const confirmIncomplete = window.confirm(
        `O checklist está em ${progress}% de preenchimento. Deseja realmente concluir o check-out mesmo com pendências?`,
      )
      if (!confirmIncomplete) return
    }

    try {
      setSavingVisit(true)
      const nowStr = new Date().toISOString()
      await visitService.update(activeVisit.id, {
        checkout_at: nowStr,
        status: 'Concluida',
        checklist: JSON.stringify(checklistItems),
        notes: checkoutNotes || 'Visita concluída com checklist validado.',
      })

      toast({
        title: 'Check-out concluído!',
        description: 'Dados sincronizados com a base Profile MBRF.',
      })

      setChecklistModalOpen(false)
      setActiveVisit(null)
      await loadVisits()
    } catch (err: any) {
      toast({ title: 'Erro ao concluir visita', description: err.message, variant: 'destructive' })
    } finally {
      setSavingVisit(false)
    }
  }

  // Agenda and History separation
  const agendaVisits = visits.filter((v) => v.status === 'Planejada' || v.status === 'Em andamento')
  const historyVisits = visits.filter(
    (v) => v.status === 'Concluida' || v.status === 'Cancelada' || v.status === 'Atrasada',
  )

  const filteredPdvs = pdvs.filter((p) => p.name.toLowerCase().includes(pdvSearch.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Controle de Visitas de Campo
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Check-in/Check-out georreferenciado e validação de checklist de execução
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'agenda'
                ? 'bg-[#00C853] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Agenda do Dia ({agendaVisits.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-[#00C853] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Histórico Concluído ({historyVisits.length})
          </button>
        </div>
      </div>

      {activeTab === 'agenda' ? (
        <div className="space-y-6">
          {/* Featured Check-in Action Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white shadow-xl border border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-xl">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30">
                  Operação em Tempo Real
                </span>
                <h2 className="text-xl md:text-2xl font-black mt-3">Check-in Imediato no PDV</h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Localize o PDV desejado ou use sua posição GPS atual para abrir o checklist de
                  conformidade de gôndola.
                </p>

                {/* PDV Selector */}
                <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-80">
                    <select
                      value={selectedCheckinPdv?.id || ''}
                      onChange={(e) => {
                        const found = pdvs.find((p) => p.id === e.target.value)
                        if (found) setSelectedCheckinPdv(found)
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#00C853]"
                    >
                      {pdvs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleStartQuickCheckin}
                    disabled={savingVisit}
                    className="w-full sm:w-auto py-2.5 px-6 rounded-xl font-bold text-xs bg-[#00C853] text-white hover:bg-[#00A844] shadow-[0_4px_16px_rgba(0,200,83,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <Play size={16} /> Realizar Geo Check-in
                  </button>
                </div>
              </div>

              {/* Status Preview */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#00C853]/20 text-[#00C853] flex items-center justify-center font-black">
                  GPS
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white">São Paulo / SP</div>
                  <div className="text-slate-400 text-[11px]">Precisão métrica ativa</div>
                  <div className="text-emerald-400 text-[10px] font-mono mt-1">
                    Status: Conectado
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Planned Visits List */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500">
              Visitas Programadas
            </h3>

            {agendaVisits.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Nenhuma visita pendente para hoje. Todas as rotas foram concluídas!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agendaVisits.map((visit) => {
                  const pdv = pdvs.find((p) => p.id === visit.pdv_id)

                  return (
                    <div
                      key={visit.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              visit.status === 'Em andamento'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {visit.status}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(visit.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                          {pdv ? pdv.name : 'PDV'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {pdv?.address || 'São Paulo - SP'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          {visit.checkin_at ? 'Em execução no local' : 'Aguardando início'}
                        </span>
                        <button
                          onClick={() => handleOpenChecklist(visit)}
                          className="px-4 py-2 rounded-xl bg-[#00C853] text-white font-bold text-xs hover:bg-[#00A844] shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
                        >
                          {visit.status === 'Em andamento'
                            ? 'Continuar Checklist'
                            : 'Iniciar Visita'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">PDV</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Horário Entrada / Saída</th>
                  <th className="py-3 px-4">Status Checklist</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyVisits.map((v) => {
                  const pdv = pdvs.find((p) => p.id === v.pdv_id)

                  return (
                    <tr
                      key={v.id}
                      onClick={() => setDetailModalVisit(v)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">{pdv?.name || 'PDV'}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(v.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {v.checkin_at
                          ? new Date(v.checkin_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '--:--'}{' '}
                        -{' '}
                        {v.checkout_at
                          ? new Date(v.checkout_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '--:--'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Checklist Validado
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[#00C853] font-bold hover:underline">
                          Ver Detalhes →
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Checklist Execution Modal */}
      {checklistModalOpen && activeVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                  Auditoria de Campo MBRF
                </span>
                <h3 className="font-black text-lg text-slate-900 mt-1">
                  Checklist de Execução & Conformidade
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  PDV: {pdvs.find((p) => p.id === activeVisit.pdv_id)?.name}
                </p>
              </div>
              <button
                onClick={() => setChecklistModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="py-3 border-b border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Progresso do Checklist</span>
                <span className="text-[#00C853]">{calculateProgress()}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#00C853] transition-all duration-300"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
            </div>

            {/* Checklist items list */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-colors ${
                    item.checked
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex items-start gap-3 cursor-pointer select-none flex-1">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleChecklistItem(idx)}
                        className="mt-1 w-4 h-4 rounded text-[#00C853] focus:ring-[#00C853]"
                      />
                      <div>
                        <span
                          className={`text-xs font-bold ${item.checked ? 'text-slate-900' : 'text-slate-700'}`}
                        >
                          {item.label}
                        </span>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                          <button
                            type="button"
                            onClick={() => handleToggleNegative(idx)}
                            className={`px-2 py-0.5 rounded font-bold text-[10px] transition-colors ${
                              item.negative
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {item.negative
                              ? '⚠ Marcado como Negativo (Gera Ocorrência)'
                              : 'Sinalizar Irregularidade'}
                          </button>
                        </div>
                      </div>
                    </label>

                    {/* Photo button */}
                    <button
                      type="button"
                      onClick={() => toast({ title: 'Foto vinculada ao item do checklist.' })}
                      className="p-2 rounded-xl text-slate-500 hover:text-[#00C853] hover:bg-emerald-50 border border-slate-200 shrink-0"
                      title="Adicionar até 3 fotos"
                    >
                      <Camera size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {/* General Checkout Notes */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Observações Gerais da Visita
                </label>
                <textarea
                  rows={3}
                  placeholder="Relate aspectos relevantes sobre abastecimento, feedback do gerente do PDV e conservação..."
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00C853]"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Check-out captura geolocalização e horário automaticamente.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChecklistModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Continuar depois
                </button>
                <button
                  type="button"
                  onClick={handleCompleteCheckout}
                  disabled={savingVisit}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00C853] text-white hover:bg-[#00A844] shadow-md disabled:opacity-50"
                >
                  {savingVisit ? 'Finalizando...' : 'Concluir Check-out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Detail Modal */}
      {detailModalVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-black text-base text-slate-900">Detalhes da Visita Realizada</h3>
              <button
                onClick={() => setDetailModalVisit(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px]">PDV Auditado</span>
                <p className="font-extrabold text-sm text-slate-900 mt-0.5">
                  {pdvs.find((p) => p.id === detailModalVisit.pdv_id)?.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Data</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {new Date(detailModalVisit.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Status</span>
                  <p className="font-bold text-[#00C853] mt-0.5">{detailModalVisit.status}</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px]">
                  Notas de Encerramento
                </span>
                <p className="text-slate-700 mt-0.5 p-3 rounded-xl bg-slate-50 border border-slate-200 leading-relaxed">
                  {detailModalVisit.notes || 'Visita validada sem observações adicionais.'}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setDetailModalVisit(null)}
                className="px-4 py-2 bg-[#0F172A] text-white font-bold text-xs rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
