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

export interface OtpResponse {
  message: string
  success: boolean
  email: string
  dev_otp?: string
}

export interface MessageResponse {
  message: string
  success: boolean
}

export const authService = {
  async signup(payload: { email: string; password: string; full_name?: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async sendSignupOtp(payload: { email: string; password: string; full_name?: string }): Promise<OtpResponse> {
    return request<OtpResponse>('/auth/signup/send-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async verifySignupOtp(payload: { email: string; otp: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/signup/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async sendForgotPasswordOtp(payload: { email: string }): Promise<OtpResponse> {
    return request<OtpResponse>('/auth/forgot-password/send-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async resetPasswordWithOtp(payload: { email: string; otp: string; new_password: string }): Promise<MessageResponse> {
    return request<MessageResponse>('/auth/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async resendOtp(payload: { email: string; purpose: 'signup' | 'forgot_password' }): Promise<OtpResponse> {
    return request<OtpResponse>('/auth/resend-otp', {
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

  async getGoogleAuthUrl(): Promise<{ auth_url: string }> {
    return request<{ auth_url: string }>('/auth/google/url')
  },

  async updateProfile(payload: { name?: string; avatar_url?: string }): Promise<UserProfile> {
    return request<UserProfile>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  async changePassword(payload: { current_password?: string; new_password: string }): Promise<MessageResponse> {
    return request<MessageResponse>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  async logout(): Promise<{ message: string; success: boolean }> {
    return request<{ message: string; success: boolean }>('/auth/logout', {
      method: 'POST',
    })
  },
}

