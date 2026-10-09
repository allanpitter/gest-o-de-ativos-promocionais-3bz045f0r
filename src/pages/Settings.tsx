import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Settings as SettingsIcon, Mail, Lock, User, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  const [fullName, setFullName] = useState(user?.full_name || user?.name || '')
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [savingProfile, setSavingProfile] = useState(false)
  const [requestingEmail, setRequestingEmail] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      setSavingProfile(true)
      await pb.collection('users').update(user.id, {
        name: fullName,
        full_name: fullName,
      })
      await refreshUser()
      toast({ title: 'Perfil atualizado com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar perfil', description: err.message, variant: 'destructive' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail) return
    try {
      setRequestingEmail(true)
      await pb.collection('users').requestEmailChange(newEmail.trim())
      toast({
        title: 'Confirmação enviada!',
        description: `Um link de confirmação foi encaminhado para ${newEmail}. Ao confirmar, sua sessão será reiniciada.`,
      })
      setNewEmail('')
    } catch (err: any) {
      toast({
        title: 'Erro ao solicitar alteração de e-mail',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setRequestingEmail(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (newPassword !== confirmPassword) {
      toast({ title: 'As novas senhas não coincidem.', variant: 'destructive' })
      return
    }
    try {
      setSavingPassword(true)
      await pb.collection('users').update(user.id, {
        oldPassword: currentPassword,
        password: newPassword,
        passwordConfirm: confirmPassword,
      })
      toast({ title: 'Senha alterada com sucesso!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast({ title: 'Erro ao alterar senha', description: err.message, variant: 'destructive' })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Configurações da Conta
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
          Gerenciamento de credenciais, dados de acesso e segurança
        </p>
      </div>

      {/* Profile info form */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
          <User size={18} className="text-[#00C853]" /> Dados Pessoais
        </h2>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Nome Completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full md:w-96 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">E-mail Atual</label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full md:w-96 p-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#00C853] text-white hover:bg-[#00A844] shadow-xs"
          >
            {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>

      {/* Two-step Email Change Form (Rule requirement) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Mail size={18} className="text-[#7C4DFF]" /> Solicitar Alteração de E-mail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Um link de verificação será enviado ao novo endereço. Após a confirmação, será
            necessário fazer login novamente.
          </p>
        </div>

        <form onSubmit={handleRequestEmailChange} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Novo E-mail Corporativo
            </label>
            <input
              type="email"
              required
              placeholder="novo.email@empresa.com.br"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full md:w-96 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={requestingEmail}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#7C4DFF] text-white hover:bg-[#6A3DF5] shadow-xs"
          >
            {requestingEmail ? 'Enviando...' : 'Enviar Link de Confirmação'}
          </button>
        </form>
      </div>

      {/* Password Change */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
          <Lock size={18} className="text-[#FF6D00]" /> Alterar Senha
        </h2>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Senha Atual</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full md:w-96 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Nova Senha (mínimo 8 dígitos)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full md:w-96 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full md:w-96 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#0F172A] text-white hover:bg-slate-800 shadow-xs"
          >
            {savingPassword ? 'Atualizando...' : 'Atualizar Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
