import { request } from './api'

export interface ThreatItem {
  id: string
  email_id?: string
  user_id: string
  threat_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  risk_score: number
  confidence: number
  summary: string
  status: 'new' | 'reviewing' | 'confirmed' | 'false_positive' | 'resolved'
  is_demo: boolean
  created_at: string
  analysis?: any
}

export interface EmailItem {
  id: string
  user_id: string
  message_id: string
  thread_id?: string
  sender: string
  recipient: string
  subject: string
  date: string
  snippet?: string
  plain_text_body?: string
  headers?: {
    from_header?: string
    to_header?: string
    reply_to?: string
    return_path?: string
    spf?: string
    dkim?: string
    dmarc?: string
    source_ip?: string
  }
  urls?: Array<{
    url: string
    domain?: string
    is_ip_based: boolean
    is_shortener: boolean
    is_punycode: boolean
    risk_flags: string[]
  }>
  is_demo: boolean
}

export interface AlertItem {
  id: string
  user_id: string
  threat_id?: string
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  is_read: boolean
  created_at: string
}

export interface ThreatMapPoint {
  ip: string
  country: string
  country_code: string
  city: string
  latitude: number
  longitude: number
  isp?: string
  asn?: string
  fraud_score: number
  is_vpn: boolean
  is_proxy: boolean
  is_tor: boolean
  disclaimer: string
  threat_id?: string
  user_email?: string
  sender?: string
  subject?: string
  threat_type?: string
  severity?: string
  risk_score?: number
}

export const threatService = {
  async getThreats(params?: { severity?: string; status?: string }): Promise<ThreatItem[]> {
    const query = new URLSearchParams()
    if (params?.severity) query.append('severity', params.severity)
    if (params?.status) query.append('status_filter', params.status)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return request<ThreatItem[]>(`/threats${qs}`)
  },

  async getThreatDetail(id: string): Promise<ThreatItem> {
    return request<ThreatItem>(`/threats/${id}`)
  },

  async getEmails(search?: string): Promise<EmailItem[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : ''
    return request<EmailItem[]>(`/emails${qs}`)
  },

  async manualScan(payload: {
    sender: string
    recipient?: string
    subject: string
    body: string
    raw_headers?: string
  }): Promise<any> {
    return request('/emails/scan/manual', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async getAlerts(): Promise<AlertItem[]> {
    return request<AlertItem[]>('/threats/user/alerts')
  },

  async markAlertRead(alertId: string): Promise<any> {
    return request(`/threats/alerts/${alertId}/read`, {
      method: 'POST',
    })
  },

  // Investigator Endpoints
  async getInvestigatorDashboard(): Promise<any> {
    return request('/investigator/dashboard')
  },

  async getInvestigatorThreats(params?: { severity?: string; threat_type?: string; status?: string }): Promise<ThreatItem[]> {
    const query = new URLSearchParams()
    if (params?.severity) query.append('severity', params.severity)
    if (params?.threat_type) query.append('threat_type', params.threat_type)
    if (params?.status) query.append('status_filter', params.status)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return request<ThreatItem[]>(`/investigator/threats${qs}`)
  },

  async getForensics(threatId: string): Promise<any> {
    return request(`/investigator/forensics/${threatId}`)
  },

  async updateStatus(threatId: string, status: string, notes?: string): Promise<any> {
    return request(`/investigator/investigations/${threatId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    })
  },

  async getUsers(): Promise<any[]> {
    return request<any[]>('/investigator/users')
  },

  async getAnalytics(): Promise<any> {
    return request('/investigator/analytics')
  },

  async getThreatMap(): Promise<ThreatMapPoint[]> {
    return request<ThreatMapPoint[]>('/geolocation/threat-map')
  },

  async downloadReportPdf(threatId: string): Promise<Blob> {
    return request<Blob>(`/investigator/reports/generate/${threatId}`)
  },

  // Demo Scenarios
  async seedDemoData(): Promise<any> {
    return request('/demo/seed', {
      method: 'POST',
    })
  },

  async resetDemoData(): Promise<any> {
    return request('/demo/reset', {
      method: 'POST',
    })
  },
}
