import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function ConfirmEmailChange() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Nenhum token fornecido.')
      return
    }

    const confirm = async () => {
      try {
        await pb.collection('users').confirmEmailChange(token, '')
        logout() // Regra da spec: desloga e pede novo login
        setStatus('success')
      } catch (err: any) {
        setStatus('error')
        setMessage(err?.message || 'Token de alteração de e-mail inválido ou expirado.')
      }
    }

    confirm()
  }, [token])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 antialiased">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center">
        {status === 'loading' && (
          <div className="py-8">
            <Loader2 size={36} className="animate-spin text-[#00C853] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-800">Confirmando troca de e-mail...</h2>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6">
            <div className="w-16 h-16 bg-emerald-100 text-[#00C853] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">E-mail Atualizado!</h2>
            <p className="text-slate-600 text-xs mt-2 leading-relaxed">
              O novo endereço foi validado. Por segurança, sua sessão foi encerrada e você deve
              entrar novamente.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 w-full py-3 px-4 bg-[#00C853] text-white font-bold text-xs rounded-xl hover:bg-[#00A844]"
            >
              Fazer Login com Novo E-mail
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle size={36} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Erro na Confirmação</h2>
            <p className="text-slate-600 text-xs mt-2">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 w-full py-3 px-4 bg-[#0F172A] text-white font-bold text-xs rounded-xl hover:bg-slate-800"
            >
              Ir para o Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
