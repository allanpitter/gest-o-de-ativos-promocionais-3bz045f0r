import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await pb.collection('users').requestPasswordReset(email.trim())
    } catch (_) {
      // Regra de segurança: resposta neutra mesmo em caso de erro/email inexistente
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 antialiased">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> Voltar ao Login
        </Link>

        {submitted ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-100 text-[#00C853] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={30} />
            </div>
            <h2 className="text-xl font-black text-slate-800">Solicitação Enviada</h2>
            <p className="text-slate-600 text-xs mt-3 leading-relaxed">
              Se o e-mail informado existir em nosso sistema, um link com as instruções para
              redefinição da sua senha foi enviado. Verifique sua caixa de entrada e a pasta de
              spam.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block w-full py-2.5 px-4 bg-[#0F172A] text-white font-bold text-xs rounded-xl hover:bg-slate-800 text-center"
            >
              Retornar ao Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">Recuperar Senha</h2>
              <p className="text-slate-500 text-xs mt-1">
                Insira o email associado à sua conta MBRF Profile
              </p>
            </div>

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
                    placeholder="seu.email@empresa.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00C853] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#00C853] text-white hover:bg-[#00A844] shadow-[0_4px_16px_rgba(0,200,83,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Enviar link de redefinição'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
