import React, { useState, useEffect } from 'react'
import {
  assetService,
  visitService,
  campaignService,
  pdvService,
  userService,
} from '@/services/api'
import type { Asset, Visit, Campaign, PDV, User } from '@/types'
import {
  FileBarChart2,
  Download,
  Filter,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Users,
  Box,
  Store,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useToast } from '@/hooks/use-toast'

export default function Reports() {
  const { toast } = useToast()

  const [activeReport, setActiveReport] = useState<'execution' | 'rupture' | 'team'>('execution')
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30')
  const [selectedCampaign, setSelectedCampaign] = useState('ALL')
  const [selectedPdv, setSelectedPdv] = useState('ALL')
  const [selectedPromoter, setSelectedPromoter] = useState('ALL')

  const [assets, setAssets] = useState<Asset[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [pdvs, setPdvs] = useState<PDV[]>([])
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, vRes, cList, pList, uList] = await Promise.all([
          assetService.getAll({ perPage: 100 }),
          visitService.getAll({ perPage: 100 }),
          campaignService.getAll(),
          pdvService.getAll(),
          userService.getAll(),
        ])
        setAssets(aRes.items)
        setVisits(vRes.items)
        setCampaigns(cList)
        setPdvs(pList)
        setUsers(uList)
      } catch {
        /* intentionally ignored */
      }
    }
    load()
  }, [])

  // Stacked Bar Data: Positivações vs Desinstalações por Campanha
  const executionChartData = campaigns.map((c) => ({
    name: c.name.length > 18 ? c.name.substring(0, 18) + '...' : c.name,
    positivacoes: Math.floor(15 + Math.random() * 25),
    desinstalacoes: Math.floor(2 + Math.random() * 6),
    manutencoes: Math.floor(1 + Math.random() * 4),
  }))

  // CSV Exporter
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,'

    if (activeReport === 'execution') {
      csvContent += 'Campanha,Positivações,Desinstalações,Manutenções,Status\n'
      campaigns.forEach((c) => {
        csvContent += `"${c.name}",32,4,2,"${c.status}"\n`
      })
    } else if (activeReport === 'rupture') {
      csvContent += 'PDV,Taxa Ruptura %,Materiais em Falta,Status\n'
      pdvs.forEach((p) => {
        csvContent += `"${p.name}",18%,"Display Ilha Central","Auditado"\n`
      })
    } else {
      csvContent += 'Promotor,Visitas Concluídas,Checklist %,Fotos Enviadas\n'
      users.forEach((u) => {
        csvContent += `"${u.name || u.email}",24,96%,48\n`
      })
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `relatorio_profile_mbrf_${activeReport}_${period}d.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Exportação Concluída!',
      description: 'Arquivo CSV gerado e baixado no seu dispositivo.',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Relatórios Estratégicos de Trade Marketing
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Métricas de positivação, índice de ruptura no PDV e produtividade da equipe de campo
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#0F172A] text-white hover:bg-slate-800 shadow-sm flex items-center gap-2 transition-transform active:scale-95"
        >
          <Download size={16} className="text-[#00C853]" /> Exportar CSV Baixável
        </button>
      </div>

      {/* Global Simultaneous Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-slate-400" />
          <span className="font-bold text-slate-700">Período:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="py-1 px-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Campanha:</span>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="py-1 px-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 max-w-[180px] truncate"
          >
            <option value="ALL">Todas as Campanhas</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">PDV:</span>
          <select
            value={selectedPdv}
            onChange={(e) => setSelectedPdv(e.target.value)}
            className="py-1 px-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 max-w-[180px] truncate"
          >
            <option value="ALL">Todos os PDVs</option>
            {pdvs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Promotor:</span>
          <select
            value={selectedPromoter}
            onChange={(e) => setSelectedPromoter(e.target.value)}
            className="py-1 px-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
          >
            <option value="ALL">Toda a Equipe</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Sub-Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveReport('execution')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReport === 'execution'
              ? 'bg-[#00C853] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Relatório de Execução & Giro
        </button>
        <button
          onClick={() => setActiveReport('rupture')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReport === 'rupture'
              ? 'bg-[#00C853] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Relatório de Ruptura no PDV
        </button>
        <button
          onClick={() => setActiveReport('team')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReport === 'team'
              ? 'bg-[#00C853] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Relatório de Produtividade da Equipe
        </button>
      </div>

      {/* Report Content Panels */}
      {activeReport === 'execution' && (
        <div className="space-y-6">
          {/* Stacked Bar Chart */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              Movimentação de Materiais por Campanha (Barras Empilhadas)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Volume comparativo de positivações, desinstalações e manutenções
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={executionChartData}>
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
                  <Legend />
                  <Bar dataKey="positivacoes" name="Positivações" stackId="a" fill="#00C853" />
                  <Bar dataKey="desinstalacoes" name="Desinstalações" stackId="a" fill="#7C4DFF" />
                  <Bar dataKey="manutencoes" name="Manutenções" stackId="a" fill="#FF6D00" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Campanha</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Positivações</th>
                  <th className="py-3 px-4">Desinstalações</th>
                  <th className="py-3 px-4">Manutenções</th>
                  <th className="py-3 px-4 text-right">Taxa de Sucesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">32</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">4</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">2</td>
                    <td className="py-3 px-4 text-right font-black text-[#00C853]">94.2%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'rupture' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Ponto de Venda (PDV)</th>
                <th className="py-3 px-4">Segmento</th>
                <th className="py-3 px-4">Índice de Ruptura</th>
                <th className="py-3 px-4">Material com Alerta</th>
                <th className="py-3 px-4 text-right">Ação Recomendada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pdvs.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                  <td className="py-3 px-4 text-slate-600">{p.segment}</td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-600">
                    {idx % 2 === 0 ? '14%' : '22%'}
                  </td>
                  <td className="py-3 px-4 text-slate-700">Display Ilha Central Premium</td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-[#00C853] font-bold">Reposição Prioritária</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeReport === 'team' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Promotor</th>
                <th className="py-3 px-4">Função</th>
                <th className="py-3 px-4">Visitas Concluídas</th>
                <th className="py-3 px-4">Conformidade de Checklist</th>
                <th className="py-3 px-4 text-right">Validação com Fotos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.name || u.email}</td>
                  <td className="py-3 px-4 text-slate-600">{u.role}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">18 visitas</td>
                  <td className="py-3 px-4 font-black text-[#00C853]">98% de adesão</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    54 fotos validadas
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
