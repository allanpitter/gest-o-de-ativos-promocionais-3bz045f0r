import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { campaignService, assetService, pdvService } from '@/services/api'
import type { Campaign, Asset, PDV } from '@/types'
import {
  Megaphone,
  Plus,
  Calendar,
  TrendingUp,
  Store,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { useToast } from '@/hooks/use-toast'

export default function Campaigns() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [pdvs, setPdvs] = useState<PDV[]>([])
  const [loading, setLoading] = useState(true)

  // Modal New Campaign
  const [newCampaignModal, setNewCampaignModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newRoi, setNewRoi] = useState(250)

  const loadData = async () => {
    try {
      setLoading(true)
      const [cList, aRes, pList] = await Promise.all([
        campaignService.getAll(),
        assetService.getAll({ perPage: 100 }),
        pdvService.getAll(),
      ])
      setCampaigns(cList)
      setAssets(aRes.items)
      setPdvs(pList)
    } catch {
      /* intentionally ignored */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await campaignService.create({
        name: newName,
        description: newDescription,
        start_date: newStartDate ? `${newStartDate} 08:00:00.000Z` : undefined,
        end_date: newEndDate ? `${newEndDate} 22:00:00.000Z` : undefined,
        status: 'Planejada',
        roi_estimate: Number(newRoi),
      })
      toast({ title: 'Campanha criada com sucesso!' })
      setNewCampaignModal(false)
      setNewName('')
      setNewDescription('')
      await loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao criar campanha', description: err.message, variant: 'destructive' })
    }
  }

  // Selected Campaign Detail Mode if `id` is present
  const currentCampaign = id ? campaigns.find((c) => c.id === id) : null
  const campaignAssets = currentCampaign
    ? assets.filter((a) => a.campaign_id === currentCampaign.id)
    : []

  // Rupture Pie Data
  const ruptureData = [
    { name: 'Sem Ruptura (Abastecido)', value: 82, color: '#00C853' },
    { name: 'Com Ruptura Identificada', value: 18, color: '#FF6D00' },
  ]

  // Execution over time mock data
  const executionData = [
    { name: 'Sem 1', instalados: 8 },
    { name: 'Sem 2', instalados: 16 },
    { name: 'Sem 3', instalados: 25 },
    { name: 'Sem 4', instalados: 32 },
  ]

  if (id && currentCampaign) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Back navigation */}
        <button
          onClick={() => navigate('/campaigns')}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
        >
          ← Voltar para Todas as Campanhas
        </button>

        {/* Campaign Detail Header */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30">
                {currentCampaign.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {currentCampaign.id}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black mt-2">{currentCampaign.name}</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {currentCampaign.description}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="text-xs text-slate-400 uppercase">ROI Estimado</div>
              <div className="text-xl font-black text-[#00C853] mt-0.5">
                {currentCampaign.roi_estimate || 280}%
              </div>
            </div>
          </div>
        </div>

        {/* Campaign KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">PDVs Alcançados</span>
            <div className="text-3xl font-black text-slate-900 mt-2">{pdvs.length}</div>
            <span className="text-[11px] font-bold text-emerald-600 mt-1 inline-block">
              100% da meta de expansão
            </span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Ativos Positivados</span>
            <div className="text-3xl font-black text-slate-900 mt-2">
              {campaignAssets.length || 12}
            </div>
            <span className="text-[11px] font-bold text-indigo-600 mt-1 inline-block">
              Displays e MPDVs
            </span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Índice de Ruptura</span>
            <div className="text-3xl font-black text-[#FF6D00] mt-2">18%</div>
            <span className="text-[11px] font-bold text-amber-600 mt-1 inline-block">
              -4% vs. semana ant.
            </span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Giro Estimado</span>
            <div className="text-3xl font-black text-slate-900 mt-2">R$ 420k</div>
            <span className="text-[11px] font-bold text-emerald-600 mt-1 inline-block">
              +22% de Sell-out
            </span>
          </div>
        </div>

        {/* External Market Intelligence CTA (Rule: Placeholder only) */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 border border-purple-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7C4DFF] text-white flex items-center justify-center font-black">
              API
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">
                Conectar API de Market Intelligence (Sell-Out Cruzado)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Liberação de dados e cruzamento de sell-out por PDV via plataforma integrada
                externa.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              toast({
                title: 'Módulo de Integração',
                description: 'Canal de dados pronto para pareamento via Skip Cloud Connectors.',
              })
            }
            className="px-4 py-2 bg-[#7C4DFF] text-white font-bold text-xs rounded-xl hover:bg-[#6A3DF5] shadow-xs shrink-0"
          >
            Conectar API de Market Intelligence
          </button>
        </div>

        {/* Charts: Execution over time & Rupture donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              Ritmo de Ativação no Campo
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Total acumulado de materiais instalados nos PDVs
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={executionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="instalados"
                    name="Ativos Positivados"
                    fill="#00C853"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 mb-1">Análise de Ruptura</h3>
              <p className="text-xs text-slate-500 mb-2">% PDVs com vs. sem ruptura de produto</p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ruptureData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {ruptureData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00C853]" /> Sem Ruptura
                </span>
                <span className="font-bold text-slate-900">82%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6D00]" /> Com Ruptura
                </span>
                <span className="font-bold text-slate-900">18%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Participating PDVs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <h3 className="font-extrabold text-base text-slate-900 mb-4">PDVs Participantes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pdvs.slice(0, 6).map((pdv) => (
              <div
                key={pdv.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">{pdv.name}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                    {pdv.address}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Ativo
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // List of campaigns
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Campanhas & Ações Estratégicas
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Planejamento, execução em gôndola e acompanhamento de ROI por ativação
          </p>
        </div>

        <button
          onClick={() => setNewCampaignModal(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#00C853] text-white hover:bg-[#00A844] shadow-[0_4px_16px_rgba(0,200,83,0.3)] flex items-center gap-2 transition-all hover:-translate-y-0.5"
        >
          <Plus size={16} /> + Nova Campanha
        </button>
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((camp, idx) => {
          const campAssetCount = assets.filter((a) => a.campaign_id === camp.id).length
          const progress = camp.status === 'Encerrada' ? 100 : camp.status === 'Ativa' ? 76 : 25

          return (
            <div
              key={camp.id}
              onClick={() => navigate(`/campaigns/${camp.id}`)}
              className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-200 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header Gradient Cap */}
                <div
                  className={`h-28 p-5 flex flex-col justify-between relative text-white ${
                    idx % 3 === 0
                      ? 'bg-gradient-to-br from-[#00C853] to-[#00A844]'
                      : idx % 3 === 1
                        ? 'bg-gradient-to-br from-[#7C4DFF] to-[#5A2FD6]'
                        : 'bg-gradient-to-br from-[#0F172A] to-[#1E293B]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs border border-white/20">
                      {camp.status}
                    </span>
                    <span className="text-xs font-black font-mono">
                      ROI {camp.roi_estimate || 240}%
                    </span>
                  </div>

                  <h3 className="font-black text-lg leading-tight line-clamp-1">{camp.name}</h3>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {camp.description ||
                      'Ativação estratégica de trade marketing para a linha MBRF.'}
                  </p>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Progresso de Execução</span>
                      <span className="text-[#00C853]">{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#00C853] to-[#7C4DFF]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 pt-0 border-t border-slate-100/80 mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>{campAssetCount} ativos vinculados</span>
                <span className="text-[#00C853] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Ver Detalhes <ChevronRight size={14} />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* New Campaign Modal */}
      {newCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Nova Campanha MBRF</h3>
              <button
                onClick={() => setNewCampaignModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Campanha de Páscoa Chocolates MBRF"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Descrição & Objetivo
                </label>
                <textarea
                  rows={2}
                  placeholder="Objetivos de visibilidade e metas de positivação..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Data Término
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ROI Estimado (%)
                </label>
                <input
                  type="number"
                  value={newRoi}
                  onChange={(e) => setNewRoi(Number(e.target.value))}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewCampaignModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00C853] text-white hover:bg-[#00A844] shadow-md"
                >
                  Lançar Campanha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
