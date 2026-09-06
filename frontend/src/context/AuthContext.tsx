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
  verifySignupOtp: (email: string, otp: string) => Promise<UserProfile>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const getInitialAuth = () => {
  if (typeof window === 'undefined') return { user: null, token: null }

  const urlParams = new URLSearchParams(window.location.search)
  const isGmailConnectReturn = urlParams.get('gmail_connected') === 'true'
  const savedToken = localStorage.getItem('vaultshield_token')
  const savedUser = localStorage.getItem('vaultshield_user')

  // If returning from Gmail OAuth connect, preserve existing authenticated session
  if (isGmailConnectReturn && savedToken) {
    return {
      token: savedToken,
      user: savedUser ? JSON.parse(savedUser) : null,
    }
  }

  const urlToken = urlParams.get('token') || urlParams.get('access_token')
  const urlEmail = urlParams.get('email')
  const urlName = urlParams.get('name')
  const urlRole = urlParams.get('role') as 'user' | 'investigator' | 'admin' | null

  if (urlToken && !savedToken) {
    const activeToken = urlToken
    const activeEmail = urlEmail || 'user@domain.com'
    const isInvestigator = activeEmail.includes('investigator') || activeEmail.includes('admin')
    const activeRole = urlRole || (isInvestigator ? 'investigator' : 'user')
    const activeName = urlName || activeEmail.split('@')[0].toUpperCase()

    const oAuthUser: UserProfile = {
      id: urlParams.get('user_id') || `usr_${Date.now()}`,
      email: activeEmail,
      name: activeName,
      role: activeRole,
    }

    localStorage.setItem('vaultshield_token', activeToken)
    localStorage.setItem('vaultshield_user', JSON.stringify(oAuthUser))
    return { user: oAuthUser, token: activeToken }
  }

  return {
    token: savedToken,
    user: savedUser ? JSON.parse(savedUser) : null,
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialAuth = getInitialAuth()
  const [user, setUser] = useState<UserProfile | null>(initialAuth.user)
  const [token, setToken] = useState<string | null>(initialAuth.token)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const refreshUser = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const isGmailConnectReturn = urlParams.get('gmail_connected') === 'true'
    const savedToken = localStorage.getItem('vaultshield_token')
    const savedUser = localStorage.getItem('vaultshield_user')

    if (isGmailConnectReturn && savedToken) {
      setToken(savedToken)
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch {
          // ignore
        }
      }
      setIsLoading(false)
      return
    }

    const urlToken = urlParams.get('token') || urlParams.get('access_token')
    const urlEmail = urlParams.get('email')
    const urlName = urlParams.get('name')
    const urlRole = urlParams.get('role') as 'user' | 'investigator' | 'admin' | null

    if (urlToken && !savedToken) {
      const activeToken = urlToken
      const activeEmail = urlEmail || 'user@domain.com'
      const isInvestigator = activeEmail.includes('investigator') || activeEmail.includes('admin')
      const activeRole = urlRole || (isInvestigator ? 'investigator' : 'user')
      const activeName = urlName || activeEmail.split('@')[0].toUpperCase()

      const oAuthUser: UserProfile = {
        id: urlParams.get('user_id') || `usr_${Date.now()}`,
        email: activeEmail,
        name: activeName,
        role: activeRole,
      }

      localStorage.setItem('vaultshield_token', activeToken)
      localStorage.setItem('vaultshield_user', JSON.stringify(oAuthUser))
      setToken(activeToken)
      setUser(oAuthUser)
      setIsLoading(false)

      window.history.replaceState({}, document.title, window.location.pathname)
      return
    }

    if (!token) {
      setIsLoading(false)
      return
    }
    try {
      const me = await authService.getMe()
      setUser(me)
      localStorage.setItem('vaultshield_user', JSON.stringify(me))
    } catch {
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch {
          // ignore
        }
      }
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

  const verifySignupOtp = async (email: string, otp: string): Promise<UserProfile> => {
    setIsLoading(true)
    try {
      const res = await authService.verifySignupOtp({ email, otp })
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
        verifySignupOtp,
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
