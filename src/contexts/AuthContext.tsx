import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { User, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  role: UserRole
  isAdmin: boolean
  isProfessor: boolean
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record
      return {
        id: rec.id,
        email: rec.email || '',
        name: (rec.name as string) || '',
        avatar: (rec.avatar as string) || '',
        role: (rec.role as UserRole) || 'professor',
        created: rec.created,
        updated: rec.updated,
      }
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(true)

  const syncUserFromStore = () => {
    if (pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record
      setUser({
        id: rec.id,
        email: rec.email || '',
        name: (rec.name as string) || '',
        avatar: (rec.avatar as string) || '',
        role: (rec.role as UserRole) || 'professor',
        created: rec.created,
        updated: rec.updated,
      })
    } else {
      setUser(null)
    }
  }

  useEffect(() => {
    syncUserFromStore()
    setIsLoading(false)

    const unsubscribe = pb.authStore.onChange(() => {
      syncUserFromStore()
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    // Limpa qualquer estado residual do realtime para evitar conflito de autorização pós-login
    try {
      pb.realtime.unsubscribe()
    } catch {
      /* intentionally ignored */
    }
    await pb.collection('users').authWithPassword(email, pass)
    syncUserFromStore()
  }

  const logout = () => {
    try {
      pb.realtime.unsubscribe()
    } catch {
      /* intentionally ignored */
    }
    pb.authStore.clear()
    setUser(null)
  }

  const refreshUser = async () => {
    if (pb.authStore.isValid) {
      try {
        // Tenta obter os dados atualizados do usuário atual
        if (pb.authStore.record?.id) {
          const fresh = await pb.collection('users').getOne<User>(pb.authStore.record.id)
          pb.authStore.save(pb.authStore.token, fresh as any)
          syncUserFromStore()
          return
        }
      } catch {
        /* se getOne falhar, tenta authRefresh tradicional */
      }

      try {
        await pb.collection('users').authRefresh()
        syncUserFromStore()
      } catch (_) {
        // Só desloga se o token estiver definitivamente inválido e não houver record
        if (!pb.authStore.isValid) {
          logout()
        }
      }
    }
  }

  const role = user?.role || 'professor'
  const isAdmin = role === 'admin'
  const isProfessor = role === 'professor' || isAdmin

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isProfessor,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
