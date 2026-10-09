import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, pass: string) => Promise<User>
  loginAsDemo: () => Promise<User>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    return (pb.authStore.record as unknown as User) || null
  })
  const [token, setToken] = useState<string | null>(pb.authStore.token || null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const unsub = pb.authStore.onChange((newToken, record) => {
      setToken(newToken)
      setUser((record as unknown as User) || null)
    })

    // Check if token valid
    if (pb.authStore.isValid) {
      setUser((pb.authStore.record as unknown as User) || null)
    } else {
      pb.authStore.clear()
      setUser(null)
      setToken(null)
    }
    setLoading(false)

    return () => {
      unsub()
    }
  }, [])

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await pb.collection('users').authWithPassword(email, pass)
    const u = res.record as unknown as User
    setUser(u)
    setToken(res.token)
    return u
  }

  const loginAsDemo = async (): Promise<User> => {
    return login('allanpitter@gmail.com', 'Skip@Pass')
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  const refreshUser = async () => {
    if (!pb.authStore.isValid) return
    try {
      const refreshed = await pb.collection('users').authRefresh()
      setUser(refreshed.record as unknown as User)
    } catch (_) {
      logout()
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginAsDemo, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  return ctx
}
