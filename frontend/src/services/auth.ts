import { request } from './api'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: 'user' | 'investigator' | 'admin'
  avatar_url?: string
  created_at?: string
}

export interface AuthResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in?: number
  user: UserProfile
}

export const authService = {
  async signup(payload: { email: string; password: string; full_name?: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async getMe(): Promise<UserProfile> {
    return request<UserProfile>('/auth/me')
  },

  async logout(): Promise<{ message: string; success: boolean }> {
    return request<{ message: string; success: boolean }>('/auth/logout', {
      method: 'POST',
    })
  },
}
