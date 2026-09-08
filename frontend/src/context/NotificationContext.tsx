import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { NotificationItem } from '../components/ui/notifications-with-actions'
import { threatService, type AlertItem } from '../services/threats'
import { useAuth } from './AuthContext'

interface NotificationContextType {
  notifications: NotificationItem[]
  loading: boolean
  refreshNotifications: () => Promise<void>
  addNotification: (notification: Omit<NotificationItem, 'id' | 'time'> & { id?: string; time?: string }) => void
  removeNotification: (id: string) => Promise<void>
  archiveNotification: (id: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
  // Specific required triggers
  notifyThreatIdentified: (threatType: string, sender?: string, riskScore?: number) => void
  notifyInvestigationSubmitted: (caseId: string, subject?: string) => void
  notifyInvestigationCompleted: (caseId: string, status?: string) => void
  notifyGoogleConnected: (email?: string) => void
  notifyGoogleDisconnected: () => void
  notifyInvestigatorNewReport: (reportId: string, sender?: string, threatType?: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'just now'
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (isNaN(diffSec) || diffSec < 45) return 'just now'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    return `${Math.floor(diffSec / 86400)}d ago`
  } catch {
    return 'recently'
  }
}

function mapAlertToNotification(alert: AlertItem): NotificationItem {
  let type: NotificationItem['type'] = 'system'
  const titleLower = (alert.title || '').toLowerCase()

  if (titleLower.includes('google') || titleLower.includes('gmail') || titleLower.includes('account')) {
    type = 'google'
  } else if (titleLower.includes('investigation') || titleLower.includes('dossier') || titleLower.includes('resolved')) {
    type = 'investigation'
  } else if (titleLower.includes('report') || titleLower.includes('submitted')) {
    type = 'report'
  } else if (titleLower.includes('threat') || titleLower.includes('phish') || alert.severity === 'high' || alert.severity === 'critical') {
    type = 'threat'
  }

  return {
    id: alert.id,
    title: alert.title,
    description: alert.message,
    time: formatRelativeTime(alert.created_at),
    type,
  }
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // Fetch real persistent alerts from Supabase database
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([])
      return
    }
    try {
      setLoading(true)
      const alerts = await threatService.getAlerts()
      const mapped = (alerts || []).map(mapAlertToNotification)
      setNotifications(mapped)
    } catch (err) {
      console.debug('Alert sync notice:', err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // 1. Initial fetch on mount & auth change
  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  // 2. 60-Second Automated Detection Polling Loop:
  // Fetches new automated threat detections, incoming emails, and status updates directly from Supabase
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      refreshNotifications()
    }, 60000) // 60 seconds automated sync

    return () => clearInterval(interval)
  }, [isAuthenticated, refreshNotifications])

  // Add temporary in-memory notification or sync with backend
  const addNotification = useCallback((item: Omit<NotificationItem, 'id' | 'time'> & { id?: string; time?: string }) => {
    const newNotification: NotificationItem = {
      id: item.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title,
      description: item.description,
      time: item.time || "just now",
      type: item.type || "system",
    }
    setNotifications(prev => [newNotification, ...prev.filter(n => n.id !== newNotification.id)])
  }, [])

  // Delete notification from Supabase
  const removeNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await threatService.deleteAlert(id)
    } catch (err) {
      console.debug('Failed to delete alert in Supabase:', err)
    }
  }, [])

  // Archive / Mark read in Supabase
  const archiveNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await threatService.markAlertRead(id)
    } catch (err) {
      console.debug('Failed to mark alert read in Supabase:', err)
    }
  }, [])

  // Clear all notifications from Supabase
  const clearAllNotifications = useCallback(async () => {
    setNotifications([])
    try {
      await threatService.clearAllAlerts()
    } catch (err) {
      console.debug('Failed to clear alerts in Supabase:', err)
    }
  }, [])

  // Event trigger helpers that immediately refresh from Supabase
  const notifyThreatIdentified = useCallback((threatType: string, sender?: string, riskScore?: number) => {
    addNotification({
      title: `🚨 High Threat Detected: ${threatType}`,
      description: sender 
        ? `High-risk email detected from "${sender}". Risk Score: ${riskScore ?? 85}/100.` 
        : `Malicious payload identified: ${threatType}. Threat analysis available in dashboard.`,
      type: 'threat',
    })
    refreshNotifications()
  }, [addNotification, refreshNotifications])

  const notifyInvestigationSubmitted = useCallback((caseId: string, subject?: string) => {
    addNotification({
      title: `📝 Report Sent for Investigation (#${caseId.slice(0, 6)})`,
      description: subject 
        ? `Investigation report sent for "${subject}". SOC investigators queued.`
        : `Case #${caseId.slice(0, 6)} submitted for forensic investigation.`,
      type: 'report',
    })
    refreshNotifications()
  }, [addNotification, refreshNotifications])

  const notifyInvestigationCompleted = useCallback((caseId: string, status?: string) => {
    addNotification({
      title: `✅ Investigation ${status || 'Resolved'} (#${caseId.slice(0, 6)})`,
      description: `Forensics review finished. Status marked as: ${status || 'Resolved & Mitigated'}.`,
      type: 'investigation',
    })
    refreshNotifications()
  }, [addNotification, refreshNotifications])

  const notifyGoogleConnected = useCallback((email?: string) => {
    addNotification({
      title: `🟢 Google Account Connected`,
      description: email 
        ? `Real-time inbox sync established with ${email} for 60s automated detection.`
        : `Google OAuth2 authentication verified and live monitoring active.`,
      type: 'google',
    })
    refreshNotifications()
  }, [addNotification, refreshNotifications])

  const notifyGoogleDisconnected = useCallback(() => {
    addNotification({
      title: `🔴 Google Account Disconnected`,
      description: `Gmail OAuth2 session disconnected. Mailbox monitoring paused.`,
      type: 'google',
    })
    refreshNotifications()
  }, [addNotification, refreshNotifications])

  const notifyInvestigatorNewReport = useCallback((reportId: string, sender?: string, threatType?: string) => {
    addNotification({
      title: `📬 New Report Came for Investigation`,
      description: `Incident #${reportId.slice(0, 6)} [${threatType || 'Suspicious Phish'}] from ${sender || 'User mailbox'} queued for triage.`,
      type: 'report',
    })
    refreshNotifications()
  }, [addNotification, refreshNotifications])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        refreshNotifications,
        addNotification,
        removeNotification,
        archiveNotification,
        clearAllNotifications,
        notifyThreatIdentified,
        notifyInvestigationSubmitted,
        notifyInvestigationCompleted,
        notifyGoogleConnected,
        notifyGoogleDisconnected,
        notifyInvestigatorNewReport,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
