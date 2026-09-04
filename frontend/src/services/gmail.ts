import { request } from './api'

export interface GmailStatus {
  is_connected: boolean
  email_address?: string
  auto_scan_enabled: boolean
  scan_limit: number
  last_synced_at?: string
}

export const gmailService = {
  async connect(): Promise<{ auth_url: string }> {
    return request<{ auth_url: string }>('/gmail/connect')
  },

  async getStatus(): Promise<GmailStatus> {
    return request<GmailStatus>('/gmail/status')
  },

  async disconnect(): Promise<{ message: string; success: boolean }> {
    return request<{ message: string; success: boolean }>('/gmail/disconnect', {
      method: 'POST',
    })
  },

  async toggleAutoScan(enabled: boolean): Promise<GmailStatus> {
    return request<GmailStatus>('/gmail/toggle-auto-scan', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    })
  },

  async scanInbox(limit: number = 10, folder: 'all' | 'inbox' | 'spam' = 'all'): Promise<any> {
    return request('/gmail/scan', {
      method: 'POST',
      body: JSON.stringify({ limit, folder }),
    })
  },
}
