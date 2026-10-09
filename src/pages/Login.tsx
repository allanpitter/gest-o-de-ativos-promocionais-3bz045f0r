import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Loader2, Lock, Mail } from 'lucide-react'

export default function Login() {
  const { login, loginAsDemo } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Informe seu email e senha.')
      return
    }

    try {
      setLoading(true)
      await login(email.trim(), password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Email ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setError(null)
    try {
      setDemoLoading(true)
      await loginAsDemo()
      navigate('/dashboard')
    } catch (err: any) {
      setError('Falha ao autenticar com a conta de demonstração.')
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row antialiased">
      {/* Left visual column (Desktop) */}
      <div className="lg:w-1/2 bg-[#0F172A] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00C853]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#7C4DFF]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00C853] to-[#00A844] flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(0,200,83,0.4)]">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-wider text-white">MBRF</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30">
                  TRADE
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] font-medium">Gestão de Ativos Promocionais</p>
            </div>
          </div>
        </div>

        {/* Central Hero Statement */}
        <div className="my-12 lg:my-0 relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-emerald-400 text-xs font-semibold backdrop-blur-xs mb-6 border border-white/10">
            <Sparkles size={14} /> Trade Marketing Inteligente de Alta Performance
          </div>

          <h1 className="text-3xl lg:text-5xl font-black leading-tight tracking-tight">
            O melhor controle para o seu produto no <span className="text-[#00C853]">PDV!</span>
          </h1>

          <p className="text-slate-300 text-sm lg:text-base mt-6 leading-relaxed font-normal">
            "Mais do que presença no PDV. É conversão, controle e resultado na veia. Do clique no
            app ao giro na gôndola, tudo registrado com validação por foto e QR Code."
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="text-2xl font-black text-[#00C853]">100%</div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                Rastreabilidade via QR Code
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="text-2xl font-black text-[#7C4DFF]">Real-time</div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                Check-in georreferenciado
              </div>
            </div>
          </div>
        </div>

        {/* Bottom credibility footer */}
        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between border-t border-white/10 pt-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#00C853]" />
            <span>Ambiente Seguro MBRF Trade Cloud</span>
          </div>
          <span className="text-slate-500 font-mono">v1.2.0 • Trade PDV</span>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Acesse sua conta
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Controle de campo e visibilidade estratégica de PDV
            </p>
          </div>

          {/* Quick Demo One-Click Login Button */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200/80">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full">
                  Zero-Touch Demo
                </span>
                <p className="text-xs text-slate-700 mt-1.5 font-medium">
                  Use{' '}
                  <span className="font-mono font-bold text-slate-900">allanpitter@gmail.com</span>{' '}
                  / <span className="font-mono font-bold text-slate-900">Skip@Pass</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={demoLoading || loading}
              className="mt-3 w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#00C853] to-[#00A844] text-white hover:opacity-95 shadow-[0_4px_16px_rgba(0,200,83,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            >
              {demoLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Conectando como Gestor Demo...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Entrar como Gestor Demo (1 Clique)
                </>
              )}
            </button>
          </div>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-[#F8FAFC] px-4 text-xs uppercase text-slate-400 font-semibold tracking-wider">
              Ou faça login com credenciais
            </span>
          </div>

          {/* Error notice */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-shake">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                E-mail corporativo
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  required
                  placeholder="ex: seu.nome@mbrf.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C853] focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Senha
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#7C4DFF] font-semibold hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C853] focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#0F172A] text-white hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Autenticando...
                </>
              ) : (
                <>
                  Entrar na Plataforma <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center text-xs text-slate-500">
            Ainda não tem acesso?{' '}
            <Link to="/register" className="font-bold text-[#00C853] hover:underline">
              Cadastre sua conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
