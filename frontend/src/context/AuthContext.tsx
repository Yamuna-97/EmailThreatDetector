import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService, type UserProfile } from '../services/auth'

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  role: 'user' | 'investigator' | 'admin'
  login: (email: string, password: string) => Promise<UserProfile>
  signup: (email: string, password: string, fullName?: string) => Promise<UserProfile>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('vaultshield_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vaultshield_token'))
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refreshUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      return
    }
    try {
      const me = await authService.getMe()
      setUser(me)
      localStorage.setItem('vaultshield_user', JSON.stringify(me))
    } catch {
      // Invalid or expired token
      localStorage.removeItem('vaultshield_token')
      localStorage.removeItem('vaultshield_user')
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setIsLoading(true)
    try {
      const res = await authService.login({ email, password })
      localStorage.setItem('vaultshield_token', res.access_token)
      localStorage.setItem('vaultshield_user', JSON.stringify(res.user))
      setToken(res.access_token)
      setUser(res.user)
      return res.user
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, fullName?: string): Promise<UserProfile> => {
    setIsLoading(true)
    try {
      const res = await authService.signup({ email, password, full_name: fullName })
      localStorage.setItem('vaultshield_token', res.access_token)
      localStorage.setItem('vaultshield_user', JSON.stringify(res.user))
      setToken(res.access_token)
      setUser(res.user)
      return res.user
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('vaultshield_token')
      localStorage.removeItem('vaultshield_user')
      setToken(null)
      setUser(null)
    }
  }

  const role = user?.role || 'user'
  const isAuthenticated = !!user && !!token

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        role,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
