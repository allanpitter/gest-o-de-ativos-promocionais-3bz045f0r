import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Nenhum token de verificação foi informado.')
      return
    }

    const verify = async () => {
      try {
        await pb.collection('users').confirmVerification(token)
        setStatus('success')
      } catch (err: any) {
        setStatus('error')
        setMessage(err?.message || 'Token de verificação inválido ou expirado.')
      }
    }

    verify()
  }, [token])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 antialiased">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center">
        {status === 'loading' && (
          <div className="py-8">
            <Loader2 size={36} className="animate-spin text-[#00C853] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-800">Verificando seu e-mail...</h2>
            <p className="text-slate-500 text-xs mt-2">
              Aguarde um momento enquanto confirmamos a autenticidade.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6">
            <div className="w-16 h-16 bg-emerald-100 text-[#00C853] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">E-mail Confirmado!</h2>
            <p className="text-slate-600 text-xs mt-2 leading-relaxed">
              Sua conta foi ativada com sucesso. Agora você tem acesso pleno à plataforma Profile
              Trade Marketing.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block w-full py-3 px-4 bg-[#00C853] text-white font-bold text-xs rounded-xl hover:bg-[#00A844] shadow-md"
            >
              Ir para o Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle size={36} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Falha na Verificação</h2>
            <p className="text-slate-600 text-xs mt-2 leading-relaxed">{message}</p>
            <Link
              to="/login"
              className="mt-6 inline-block w-full py-3 px-4 bg-[#0F172A] text-white font-bold text-xs rounded-xl hover:bg-slate-800"
            >
              Voltar ao Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
