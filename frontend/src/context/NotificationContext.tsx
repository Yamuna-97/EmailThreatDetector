import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { NotificationItem } from '../components/ui/notifications-with-actions'

interface NotificationContextType {
  notifications: NotificationItem[]
  addNotification: (notification: Omit<NotificationItem, 'id' | 'time'> & { id?: string; time?: string }) => void
  removeNotification: (id: string) => void
  archiveNotification: (id: string) => void
  clearAllNotifications: () => void
  // Specific required triggers
  notifyThreatIdentified: (threatType: string, sender?: string, riskScore?: number) => void
  notifyInvestigationSubmitted: (caseId: string, subject?: string) => void
  notifyInvestigationCompleted: (caseId: string, status?: string) => void
  notifyGoogleConnected: (email?: string) => void
  notifyGoogleDisconnected: () => void
  notifyInvestigatorNewReport: (reportId: string, sender?: string, threatType?: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const initialNotifications: NotificationItem[] = [
  {
    id: "init-1",
    title: "⚡ CyberTrace Shield Active",
    description: "Continuous AI mailbox threat protection and heuristics active.",
    time: "just now",
    type: "system",
  },
  {
    id: "init-2",
    title: "🛡️ Identified Threat Message",
    description: "Suspicious spear-phishing domain detected in incoming email payload.",
    time: "2m ago",
    type: "threat",
  },
  {
    id: "init-3",
    title: "📋 Investigation Case #489 Completed",
    description: "Investigator marked forensic analysis as resolved (False-positive mitigation).",
    time: "15m ago",
    type: "investigation",
  },
  {
    id: "init-4",
    title: "🔗 Google Mail Connected",
    description: "OAuth2 background mailbox watcher synchronized successfully.",
    time: "1h ago",
    type: "google",
  }
]

// Periodic simulated notifications generated every 60 seconds
const periodicTemplates = [
  {
    title: "🛡️ AI Telemetry Check (60s Pulse)",
    description: "Zero-day heuristics scanned incoming message queue. 0 critical vulnerabilities.",
    type: "system" as const,
  },
  {
    title: "⚠️ Identified Threat Message",
    description: "Heuristics flagged an urgent wire transfer request with high risk score (89/100).",
    type: "threat" as const,
  },
  {
    title: "📑 New Report Submitted for Investigation",
    description: "User flagged an email for SOC forensic review. Dossier queued.",
    type: "report" as const,
  },
  {
    title: "🔍 SOC Investigation Completed",
    description: "SOC investigator concluded forensic triage on Incident #8412.",
    type: "investigation" as const,
  },
  {
    title: "🚨 Investigator Alert: New Report Received",
    description: "A new suspicious DMARC failure was reported and assigned to your SOC queue.",
    type: "report" as const,
  },
  {
    title: "⚡ Live Threat Feed Synchronized",
    description: "Updated 4,200+ malicious IP indicators from global cyber defense feeds.",
    type: "system" as const,
  }
]

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('cybertrace_notifications')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return initialNotifications
  })

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('cybertrace_notifications', JSON.stringify(notifications))
    } catch {
      // ignore
    }
  }, [notifications])

  const addNotification = useCallback((item: Omit<NotificationItem, 'id' | 'time'> & { id?: string; time?: string }) => {
    const newNotification: NotificationItem = {
      id: item.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title,
      description: item.description,
      time: item.time || "just now",
      type: item.type || "system",
    }
    setNotifications(prev => [newNotification, ...prev.slice(0, 19)]) // keep max 20
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const archiveNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // 1. Specific trigger: Threat Identified
  const notifyThreatIdentified = useCallback((threatType: string, sender?: string, riskScore?: number) => {
    addNotification({
      title: `🚨 Identified a Threat Message (${threatType})`,
      description: sender 
        ? `High-risk email detected from "${sender}". Risk Score: ${riskScore ?? 85}/100.` 
        : `Malicious payload identified: ${threatType}. Threat analysis available in dashboard.`,
      type: 'threat',
    })
  }, [addNotification])

  // 2. Specific trigger: Report Investigation Submitted ("report investigation puted")
  const notifyInvestigationSubmitted = useCallback((caseId: string, subject?: string) => {
    addNotification({
      title: `📝 Report Put for Investigation (#${caseId.slice(0, 6)})`,
      description: subject 
        ? `Investigation submitted for "${subject}". SOC investigators notified.`
        : `Case #${caseId.slice(0, 6)} submitted for expert security investigation.`,
      type: 'report',
    })
  }, [addNotification])

  // 3. Specific trigger: Investigation Completed
  const notifyInvestigationCompleted = useCallback((caseId: string, status?: string) => {
    addNotification({
      title: `✅ Investigation Completed (#${caseId.slice(0, 6)})`,
      description: `Forensics review finished. Status marked as: ${status || 'Resolved & Mitigated'}.`,
      type: 'investigation',
    })
  }, [addNotification])

  // 4. Specific trigger: Google Connected
  const notifyGoogleConnected = useCallback((email?: string) => {
    addNotification({
      title: `🟢 Google Mail Connected`,
      description: email 
        ? `Real-time inbox sync established with ${email}.`
        : `Google OAuth2 authentication verified and live monitoring enabled.`,
      type: 'google',
    })
  }, [addNotification])

  // 5. Specific trigger: Google Disconnected
  const notifyGoogleDisconnected = useCallback(() => {
    addNotification({
      title: `🔴 Google is Disconnected`,
      description: `Gmail OAuth2 session terminated or offline. Please reconnect in profile settings.`,
      type: 'google',
    })
  }, [addNotification])

  // 6. Specific trigger: For Investigators - New Report Arrived
  const notifyInvestigatorNewReport = useCallback((reportId: string, sender?: string, threatType?: string) => {
    addNotification({
      title: `📬 New Report Came for Investigation`,
      description: `Incident #${reportId.slice(0, 6)} [${threatType || 'Suspicious Phish'}] from ${sender || 'User mailbox'} queued for triage.`,
      type: 'report',
    })
  }, [addNotification])

  // 7. Automatic periodic notification every 60 seconds (as explicitly requested)
  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      const template = periodicTemplates[index % periodicTemplates.length]
      index++
      addNotification({
        title: template.title,
        description: template.description,
        type: template.type,
        time: "just now",
      })
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [addNotification])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
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
