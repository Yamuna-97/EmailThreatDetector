import { request } from './api'

export interface GmailStatus {
  is_connected: boolean
  email_address?: string
  auto_scan_enabled: boolean
  scan_limit: number
  last_synced_at?: string
  // Automatic monitoring fields
  monitoring_active: boolean
  emails_auto_processed: number
  warnings_sent: number
  watch_expiry?: string
  last_event_time?: string
}

export interface MonitoringStatus {
  monitoring_active: boolean
  mode: 'disabled' | 'pubsub' | 'polling'
  email_address?: string
  watch_expiry?: string
  last_history_id?: string
  emails_auto_processed: number
  threats_detected: number
  warnings_sent: number
  last_event_time?: string
  poll_interval_seconds?: number
  error?: string
}

export interface GmailMessagePreview {
  id: string
  thread_id?: string
  subject: string
  sender: string
  date: string
  snippet: string
  folder: 'inbox' | 'spam'
  already_scanned: boolean
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

  async fetchMessagesList(limit: number = 10, folder: 'all' | 'inbox' | 'spam' = 'all'): Promise<{ messages: GmailMessagePreview[]; total: number; is_live: boolean }> {
    return request<{ messages: GmailMessagePreview[]; total: number; is_live: boolean }>(`/gmail/messages-list?limit=${limit}&folder=${folder}`)
  },

  async scanSelected(messageIds: string[]): Promise<any> {
    return request('/gmail/scan-selected', {
      method: 'POST',
      body: JSON.stringify({ message_ids: messageIds }),
    })
  },

  // ---- Automatic Monitoring ----

  async getMonitoringStatus(): Promise<MonitoringStatus> {
    return request<MonitoringStatus>('/gmail/monitor/status')
  },

  async startMonitoring(): Promise<MonitoringStatus> {
    return request<MonitoringStatus>('/gmail/monitor/start', {
      method: 'POST',
    })
  },

  async stopMonitoring(): Promise<MonitoringStatus> {
    return request<MonitoringStatus>('/gmail/monitor/stop', {
      method: 'POST',
    })
  },
}
