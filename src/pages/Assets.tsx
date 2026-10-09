import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { assetService, pdvService, campaignService, assetHistoryService } from '@/services/api'
import type { Asset, PDV, Campaign, AssetHistory, AssetCategory, AssetStatus } from '@/types'
import {
  Box,
  Search,
  Filter,
  Plus,
  QrCode,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  MapPin,
  X,
  Camera,
  Upload,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Assets() {
  const [searchParams] = useSearchParams()
  const highlightAssetId = searchParams.get('asset')
  const { toast } = useToast()

  const [assets, setAssets] = useState<Asset[]>([])
  const [pdvs, setPdvs] = useState<PDV[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & View Mode
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [selectedPdv, setSelectedPdv] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Detail Modal & Timeline
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [assetHistory, setAssetHistory] = useState<AssetHistory[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  // Modals
  const [newAssetModalOpen, setNewAssetModalOpen] = useState(false)
  const [actionModal, setActionModal] = useState<{
    open: boolean
    type: 'Positivacao' | 'Desinstalacao' | 'Manutencao' | null
  }>({ open: false, type: null })
  const [qrBigModalOpen, setQrBigModalOpen] = useState(false)

  // Action Form State (Positivação / Desinstalação / Manutenção)
  const [actionNotes, setActionNotes] = useState('')
  const [actionPdvId, setActionPdvId] = useState('')
  const [actionGeo, setActionGeo] = useState<{ lat?: number; lng?: number }>({})
  const [actionGeoText, setActionGeoText] = useState('')
  const [actionFile, setActionFile] = useState<File | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // New Asset Form
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<AssetCategory>('MPDV')
  const [newQrCode, setNewQrCode] = useState(`MBRF-${Math.floor(1000 + Math.random() * 9000)}`)
  const [newDescription, setNewDescription] = useState('')
  const [newPdvId, setNewPdvId] = useState('')
  const [newCampaignId, setNewCampaignId] = useState('')
  const [newStatus, setNewStatus] = useState<AssetStatus>('Em base')

  const loadData = async () => {
    try {
      setLoading(true)
      const [assetsRes, pdvsList, campaignsList] = await Promise.all([
        assetService.getAll({ perPage: 100 }),
        pdvService.getAll(),
        campaignService.getAll(),
      ])
      setAssets(assetsRes.items)
      setPdvs(pdvsList)
      setCampaigns(campaignsList)

      if (highlightAssetId) {
        const found = assetsRes.items.find((a) => a.id === highlightAssetId)
        if (found) handleOpenDetail(found)
      }
    } catch {
      /* intentionally ignored */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [highlightAssetId])

  const handleOpenDetail = async (asset: Asset) => {
    setSelectedAsset(asset)
    setDetailLoading(true)
    try {
      const history = await assetHistoryService.getByAssetId(asset.id)
      setAssetHistory(history)
    } catch (_) {
      setAssetHistory([])
    } finally {
      setDetailLoading(false)
    }
  }

  // Capture Geolocation
  const handleCaptureGeo = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(5))
          const lng = parseFloat(pos.coords.longitude.toFixed(5))
          setActionGeo({ lat, lng })
          setActionGeoText(`${lat}, ${lng}`)
          toast({ title: 'Localização GPS capturada com sucesso!' })
        },
        () => {
          // Fallback manual default SP
          setActionGeo({ lat: -23.5653, lng: -46.6517 })
          setActionGeoText('-23.5653, -46.6517')
          toast({ title: 'GPS indisponível, inseridas coordenadas padrão' })
        },
      )
    }
  }

  const handleOpenActionModal = (type: 'Positivacao' | 'Desinstalacao' | 'Manutencao') => {
    setActionModal({ open: true, type })
    setActionNotes('')
    setActionFile(null)
    setActionPdvId(selectedAsset?.current_pdv_id || pdvs[0]?.id || '')
    handleCaptureGeo()
  }

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset || !actionModal.type) return

    try {
      setActionLoading(true)
      // Calls custom route scan or service
      await assetService.scanQR(
        selectedAsset.qr_code,
        actionModal.type,
        `${actionNotes} [Geo: ${actionGeoText || 'SP'}]`,
        actionPdvId,
      )

      // Create history record
      const formData = new FormData()
      formData.append('asset_id', selectedAsset.id)
      formData.append('action', actionModal.type)
      if (actionPdvId) formData.append('pdv_id', actionPdvId)
      formData.append(
        'notes',
        actionNotes || `Ação de ${actionModal.type} confirmada com validação.`,
      )
      if (actionFile) formData.append('photo', actionFile)
      await assetHistoryService.create(formData)

      toast({
        title: 'Operação registrada com sucesso!',
        description: `${actionModal.type} registrada no ativo ${selectedAsset.name}.`,
      })

      setActionModal({ open: false, type: null })
      await loadData()
      if (selectedAsset) {
        const refreshed = await assetService.getById(selectedAsset.id)
        handleOpenDetail(refreshed)
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar ação',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await assetService.create({
        name: newName,
        category: newCategory,
        qr_code: newQrCode,
        description: newDescription,
        status: newStatus,
        condition: 'Otimo',
        current_pdv_id: newPdvId || undefined,
        campaign_id: newCampaignId || undefined,
      })

      toast({ title: 'Ativo promocional criado com sucesso!' })
      setNewAssetModalOpen(false)
      setNewName('')
      setNewDescription('')
      setNewQrCode(`MBRF-${Math.floor(1000 + Math.random() * 9000)}`)
      await loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao criar ativo', description: err.message, variant: 'destructive' })
    }
  }

  // Filter logic
  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.qr_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = selectedCategory === 'ALL' || a.category === selectedCategory
    const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus
    const matchesPdv = selectedPdv === 'ALL' || a.current_pdv_id === selectedPdv
    return matchesSearch && matchesCat && matchesStatus && matchesPdv
  })

  const getStatusBadge = (st: AssetStatus) => {
    switch (st) {
      case 'Instalado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Instalado
          </span>
        )
      case 'Em trânsito':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            Em trânsito
          </span>
        )
      case 'Em base':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
            Em base
          </span>
        )
      case 'Em manutenção':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            Em manutenção
          </span>
        )
      case 'Desinstalado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
            Desinstalado
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {st}
          </span>
        )
    }
  }

  const getConditionColor = (cond?: string) => {
    switch (cond) {
      case 'Otimo':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      case 'Bom':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'Regular':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'Ruim':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestão de Ativos Promocionais
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Controle, rastreabilidade e histórico de materiais promocionais no PDV via QR Code
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#00C853] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visão em Mosaico"
            >
              <LayoutGrid size={17} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#00C853] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visão em Tabela"
            >
              <TableIcon size={17} />
            </button>
          </div>

          <button
            onClick={() => setNewAssetModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#00C853] text-white hover:bg-[#00A844] shadow-[0_4px_16px_rgba(0,200,83,0.3)] flex items-center gap-2 transition-all hover:-translate-y-0.5"
          >
            <Plus size={16} /> + Novo Ativo
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar por nome do material ou código QR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00C853]"
            />
          </div>

          {/* Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-44 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
          >
            <option value="ALL">Todas Categorias</option>
            <option value="MPDV">MPDV</option>
            <option value="DISPLAY">Display</option>
            <option value="ESTRUTURA">Estrutura</option>
            <option value="PONTA DE GONDOLA">Ponta de Gôndola</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-44 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
          >
            <option value="ALL">Todos os Status</option>
            <option value="Instalado">Instalado</option>
            <option value="Em trânsito">Em trânsito</option>
            <option value="Em base">Em base</option>
            <option value="Desinstalado">Desinstalado</option>
            <option value="Em manutenção">Em manutenção</option>
          </select>

          {/* PDV */}
          <select
            value={selectedPdv}
            onChange={(e) => setSelectedPdv(e.target.value)}
            className="w-full md:w-52 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 truncate"
          >
            <option value="ALL">Todos os PDVs</option>
            {pdvs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>{filteredAssets.length} ativos encontrados</span>
          <span className="font-mono text-[11px] text-[#00C853]">MBRF QR Active Engine</span>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        filteredAssets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Box size={40} className="text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              Nenhum ativo promocional localizado
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tente remover filtros ou cadastrar um novo ativo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredAssets.map((asset) => {
              const currentPdv = pdvs.find((p) => p.id === asset.current_pdv_id)

              return (
                <div
                  key={asset.id}
                  onClick={() => handleOpenDetail(asset)}
                  className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Top Chips */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-[#7C4DFF]/15 text-[#7C4DFF] border border-[#7C4DFF]/30">
                        {asset.category}
                      </span>
                      {getStatusBadge(asset.status)}
                    </div>

                    {/* QR Code Mini Tag */}
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold mb-2">
                      <QrCode size={12} className="text-slate-500" />
                      {asset.qr_code}
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#00C853] transition-colors leading-snug line-clamp-2">
                      {asset.name}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                      {asset.description || 'Material oficial de comunicação para campanhas MBRF.'}
                    </p>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[170px] flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      {currentPdv ? currentPdv.name : 'Armazenado em Base'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getConditionColor(asset.condition)}`}
                    >
                      {asset.condition || 'Bom'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Código QR</th>
                  <th className="py-3 px-4">Nome do Material</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">PDV Atual</th>
                  <th className="py-3 px-4">Condição</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((asset) => {
                  const currentPdv = pdvs.find((p) => p.id === asset.current_pdv_id)

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => handleOpenDetail(asset)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {asset.qr_code}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{asset.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {asset.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {currentPdv ? currentPdv.name : 'Em Base'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getConditionColor(asset.condition)}`}
                        >
                          {asset.condition || 'Bom'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(asset.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[#00C853] font-bold hover:underline">Detalhes →</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Asset Detail Drawer / Side Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setSelectedAsset(null)}
            className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-xs transition-opacity"
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col animate-slide-left">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#7C4DFF]/15 text-[#7C4DFF] font-bold text-[10px] uppercase">
                      {selectedAsset.category}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      [{selectedAsset.qr_code}]
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 mt-1">{selectedAsset.name}</h2>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status & Condition banner */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Status Operacional
                    </span>
                    <div className="mt-1">{getStatusBadge(selectedAsset.status)}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Condição do Material
                    </span>
                    <div className="mt-1">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-bold border ${getConditionColor(selectedAsset.condition)}`}
                      >
                        {selectedAsset.condition || 'Bom'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Fields */}
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-500 uppercase text-[10px]">
                      Descrição Técnica
                    </span>
                    <p className="text-slate-800 mt-0.5 leading-relaxed">
                      {selectedAsset.description ||
                        'Material padrão homologado para positivação MBRF.'}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 uppercase text-[10px]">
                      Ponto de Venda Atual
                    </span>
                    <p className="text-slate-900 font-bold text-sm mt-0.5 flex items-center gap-1.5">
                      <MapPin size={15} className="text-[#00C853]" />
                      {pdvs.find((p) => p.id === selectedAsset.current_pdv_id)?.name ||
                        'Armazenado em Base Logística'}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 uppercase text-[10px]">
                      Campanha Vinculada
                    </span>
                    <p className="text-slate-800 font-medium mt-0.5">
                      {campaigns.find((c) => c.id === selectedAsset.campaign_id)?.name ||
                        'Geral Trade MBRF'}
                    </p>
                  </div>
                </div>

                {/* Quick Field Actions */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-100 space-y-2">
                  <div className="text-xs font-bold text-slate-800">
                    Ações de Campo em Tempo Real
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleOpenActionModal('Positivacao')}
                      className="py-2 px-2 bg-[#00C853] text-white font-bold text-[11px] rounded-xl hover:bg-[#00A844] shadow-xs text-center"
                    >
                      Positivação
                    </button>
                    <button
                      onClick={() => handleOpenActionModal('Desinstalacao')}
                      className="py-2 px-2 bg-[#7C4DFF] text-white font-bold text-[11px] rounded-xl hover:bg-[#6A3DF5] shadow-xs text-center"
                    >
                      Desinstalação
                    </button>
                    <button
                      onClick={() => handleOpenActionModal('Manutencao')}
                      className="py-2 px-2 bg-[#FF6D00] text-white font-bold text-[11px] rounded-xl hover:bg-[#e06000] shadow-xs text-center"
                    >
                      Manutenção
                    </button>
                  </div>

                  <button
                    onClick={() => setQrBigModalOpen(true)}
                    className="w-full mt-2 py-2 px-3 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50"
                  >
                    <QrCode size={16} /> Abrir QR Code para Leitura
                  </button>
                </div>

                {/* Timeline History */}
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-3">
                    Histórico de Posições & Auditorias
                  </h4>
                  {detailLoading ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      Carregando histórico...
                    </div>
                  ) : assetHistory.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl">
                      Nenhum histórico registrado para este ativo.
                    </div>
                  ) : (
                    <div className="space-y-4 pl-2 border-l-2 border-slate-200">
                      {assetHistory.map((hist) => (
                        <div key={hist.id} className="relative pl-4 space-y-1">
                          <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#00C853] border-2 border-white" />
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">{hist.action}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(hist.created).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{hist.notes}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal (Positivação / Desinstalação / Manutenção) */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">
                Registrar {actionModal.type}
              </h3>
              <button
                onClick={() => setActionModal({ open: false, type: null })}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAction} className="space-y-4">
              {actionModal.type === 'Positivacao' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Selecione o PDV de Destino
                  </label>
                  <select
                    value={actionPdvId}
                    onChange={(e) => setActionPdvId(e.target.value)}
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
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Observações de Campo
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva as condições de instalação, integridade e conformidade..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00C853]"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Camera size={14} className="text-[#00C853]" /> Foto Obrigatória de Validação
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setActionFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-[#00C853] hover:file:bg-emerald-100"
                />
              </div>

              {/* Geo location auto badge */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#00C853]" />
                  <span className="text-slate-600 font-mono text-[11px]">
                    {actionGeoText || 'Localizando GPS...'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureGeo}
                  className="text-[10px] text-[#00C853] font-bold underline"
                >
                  Recapturar
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionModal({ open: false, type: null })}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00C853] text-white hover:bg-[#00A844] shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Salvando...' : 'Confirmar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Big Modal */}
      {qrBigModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl border border-slate-200">
            <h3 className="font-black text-lg text-slate-900">{selectedAsset.name}</h3>
            <p className="font-mono text-xs font-bold text-[#00C853] mt-1">
              {selectedAsset.qr_code}
            </p>

            {/* Generated Mock/Real QR Visual */}
            <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedAsset.qr_code)}`}
                alt="QR Code Ativo"
                className="w-44 h-44 mx-auto rounded-lg"
              />
            </div>

            <p className="text-[11px] text-slate-500 mb-6">
              Aproxime a câmera do app do promotor de campo para acionar check-in ou manutenção
              relâmpago.
            </p>

            <button
              onClick={() => setQrBigModalOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0F172A] text-white font-bold text-xs hover:bg-slate-800"
            >
              Fechar QR Code
            </button>
          </div>
        </div>
      )}

      {/* New Asset Modal */}
      {newAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Novo Ativo Promocional</h3>
              <button
                onClick={() => setNewAssetModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nome do Ativo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Display Ilha Central MBRF"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as AssetCategory)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="MPDV">MPDV</option>
                    <option value="DISPLAY">Display</option>
                    <option value="ESTRUTURA">Estrutura</option>
                    <option value="PONTA DE GONDOLA">Ponta de Gôndola</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Código QR</label>
                  <input
                    type="text"
                    required
                    value={newQrCode}
                    onChange={(e) => setNewQrCode(e.target.value)}
                    className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Dimensões, material e especificações..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    PDV Inicial (Opcional)
                  </label>
                  <select
                    value={newPdvId}
                    onChange={(e) => setNewPdvId(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">Em Base / Nenhum</option>
                    {pdvs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Campanha</label>
                  <select
                    value={newCampaignId}
                    onChange={(e) => setNewCampaignId(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">Nenhuma / Geral</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewAssetModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00C853] text-white hover:bg-[#00A844] shadow-md"
                >
                  Cadastrar Ativo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
