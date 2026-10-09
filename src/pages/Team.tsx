import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService, visitService, pdvService } from '@/services/api'
import type { User, Visit, PDV } from '@/types'
import {
  Users as UsersIcon,
  MapPin,
  CalendarCheck,
  TrendingUp,
  Clock,
  Route,
  ChevronRight,
  X,
  Store,
  Award,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function Team() {
  const navigate = useNavigate()

  const [users, setUsers] = useState<User[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [pdvs, setPdvs] = useState<PDV[]>([])
  const [selectedPromoter, setSelectedPromoter] = useState<User | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [uList, vRes, pList] = await Promise.all([
          userService.getAll(),
          visitService.getAll({ perPage: 100 }),
          pdvService.getAll(),
        ])
        setUsers(uList)
        setVisits(vRes.items)
        setPdvs(pList)
      } catch {
        /* intentionally ignored */
      }
    }
    load()
  }, [])

  const weeklyPerfData = [
    { dia: 'Seg', visitas: 5 },
    { dia: 'Ter', visitas: 6 },
    { dia: 'Qua', visitas: 4 },
    { dia: 'Qui', visitas: 7 },
    { dia: 'Sex', visitas: 6 },
  ]

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Equipe de Campo & Performance
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
          Monitoramento de promotores em tempo real, visitas atribuídas e taxa de execução
        </p>
      </div>

      {/* Promoters Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((promoter, idx) => {
          const isOnline = idx < 3
          const assignedPdv = pdvs[idx % pdvs.length]?.name || 'Base Operacional'
          const initials = promoter.name
            ? promoter.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()
            : 'PR'

          return (
            <div
              key={promoter.id}
              onClick={() => setSelectedPromoter(promoter)}
              className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-xl transition-all duration-200 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header row with Avatar & Online Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7C4DFF] to-[#00C853] text-white flex items-center justify-center font-black text-base shadow-sm">
                      {initials}
                    </div>
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        isOnline ? 'bg-[#00C853] animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isOnline ? 'Online em Campo' : 'Offline'}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#00C853] transition-colors">
                  {promoter.name || promoter.email}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {promoter.role} • Região São Paulo
                </p>

                {/* PDV Atual */}
                <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs">
                  <Store size={15} className="text-[#00C853] shrink-0" />
                  <span className="text-slate-700 font-semibold truncate">{assignedPdv}</span>
                </div>

                {/* Performance numbers */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-lg font-black text-slate-900">4 / 5</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                      Visitas Hoje
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-lg font-black text-[#00C853]">96%</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                      Execução
                    </div>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400 text-[11px]">Último check-in: há 45 min</span>
                <span className="text-[#00C853] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Ver Detalhes <ChevronRight size={14} />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Promoter Detail Modal */}
      {selectedPromoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C4DFF] to-[#00C853] text-white flex items-center justify-center font-black">
                  {selectedPromoter.name?.substring(0, 2).toUpperCase() || 'PR'}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {selectedPromoter.name || selectedPromoter.email}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedPromoter.role} • MBRF Trade Cloud
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPromoter(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Performance Weekly Mini Chart */}
            <div>
              <span className="font-bold text-slate-700 text-xs">Visitas Concluídas na Semana</span>
              <div className="h-40 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyPerfData}>
                    <XAxis dataKey="dia" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="visitas" fill="#00C853" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  const promId = selectedPromoter.id
                  setSelectedPromoter(null)
                  navigate(`/route?promoter=${promId}`)
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#00C853] text-white font-bold text-xs hover:bg-[#00A844] shadow-md flex items-center justify-center gap-1.5"
              >
                <Route size={15} /> Atribuir Rota do Dia
              </button>
              <button
                onClick={() => setSelectedPromoter(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
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
