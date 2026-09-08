import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  ShieldAlert, Mail, Sparkles, RefreshCw, AlertTriangle,
  Eye, Clock, Activity, LogOut, Inbox, CheckCircle, XCircle, X,
  User, Shield, Bell, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { gmailService, type GmailStatus, type MonitoringStatus } from '../../services/gmail'
import { threatService, type ThreatItem, type EmailItem, type AlertItem } from '../../services/threats'
import ManualScanModal from './ManualScanModal'
import ForensicsModal from './ForensicsModal'
import { UserRAGAssistant } from './UserRAGAssistant'
import { CoreSpinLoader } from '../ui/core-spin-loader'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
import { IncidentReportCard, buildUserTelemetry } from '@/components/ui/area-chart-1'
import { UserProfileView } from './UserProfileView'
import { GmailScannerView } from './GmailScannerView'
import { CyberTraceLogoIcon } from '../CyberTraceLogo'
import NotificationsWithActions from '../ui/notifications-with-actions'
import { useNotifications } from '../../context/NotificationContext'
import { ThemeToggle } from '../ui/ThemeToggle'

import { EmailsDataTable } from './EmailsDataTable'

interface NavTabItem {
  id: 'dashboard' | 'gmail-scan' | 'emails' | 'ai-advisor' | 'alerts' | 'history' | 'profile'
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  count?: number
}

/* ── Severity helper ──────────────────────────────────────── */
const sevClass = (s: string) => {
  if (s === 'critical') return 'critical'
  if (s === 'high') return 'high'
  if (s === 'medium') return 'medium'
  return 'low'
}

const sevColors = {
  critical: { bg: 'bg-[#FF1E2D]/10', text: 'text-[#FF1E2D]', border: 'border-[#FF1E2D]/30', dot: 'bg-[#FF1E2D]' },
  high: { bg: 'bg-[#FF5A36]/10', text: 'text-[#FF5A36]', border: 'border-[#FF5A36]/30', dot: 'bg-[#FF5A36]' },
  medium: { bg: 'bg-[#FFB020]/10', text: 'text-[#FFB020]', border: 'border-[#FFB020]/30', dot: 'bg-[#FFB020]' },
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
}

export const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const { notifications, removeNotification, archiveNotification } = useNotifications()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gmail-scan' | 'emails' | 'ai-advisor' | 'alerts' | 'history' | 'profile'>('dashboard')

  const [advisorSelectedEmailId, setAdvisorSelectedEmailId] = useState<string>('')
  const [threats, setThreats] = useState<ThreatItem[]>([])
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null)
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [scanModalOpen, setScanModalOpen] = useState<boolean>(false)
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null)
  const [syncingGmail, setSyncingGmail] = useState<boolean>(false)
  const [scanFolder, setScanFolder] = useState<'all' | 'inbox' | 'spam'>('all')
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const monitoringPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [oauthBanner, setOauthBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const oauthHandled = useRef(false)

  const loadAllData = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [tRes, eRes, aRes, gRes, mRes] = await Promise.all([
        threatService.getThreats().catch(() => []),
        threatService.getEmails().catch(() => []),
        threatService.getAlerts().catch(() => []),
        gmailService.getStatus().catch(() => ({ is_connected: false, auto_scan_enabled: false, scan_limit: 10, monitoring_active: false, emails_auto_processed: 0, warnings_sent: 0 })),
        gmailService.getMonitoringStatus().catch(() => null),
      ])
      setThreats(tRes)
      setEmails(eRes)
      setAlerts(aRes)
      setGmailStatus(gRes as GmailStatus)
      if (mRes) {
        setMonitoringStatus(mRes)
      } else if (gRes) {
        setMonitoringStatus({
          monitoring_active: (gRes as GmailStatus).monitoring_active ?? false,
          mode: 'polling',
          email_address: (gRes as GmailStatus).email_address,
          emails_auto_processed: (gRes as GmailStatus).emails_auto_processed ?? 0,
          threats_detected: (gRes as GmailStatus).warnings_sent ?? 0,
          warnings_sent: (gRes as GmailStatus).warnings_sent ?? 0,
        })
      }
      setSelectedEmail(prev => {
        if (!prev) return null
        const fresh = eRes.find(e => e.id === prev.id)
        return fresh || prev
      })
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (!oauthHandled.current) {
      oauthHandled.current = true
      const params = new URLSearchParams(window.location.search)
      const connected = params.get('gmail_connected')
      const oauthError = params.get('error')

      if (connected === 'true') {
        window.history.replaceState({}, '', window.location.pathname)
        setOauthBanner({ type: 'success', message: 'Gmail connected successfully! You can now scan your inbox or enable automatic monitoring.' })
        loadAllData().then(() => setActiveTab('dashboard'))
        setTimeout(() => setOauthBanner(null), 6000)
        return
      }

      if (oauthError) {
        window.history.replaceState({}, '', window.location.pathname)
        const errorMessages: Record<string, string> = {
          oauth_cancelled: 'Gmail connection was cancelled.',
          token_exchange_failed: 'Gmail connection failed — token exchange error. Please try again.',
        }
        setOauthBanner({ type: 'error', message: errorMessages[oauthError] || 'Gmail connection error. Please try again.' })
        setTimeout(() => setOauthBanner(null), 7000)
      }
    }
    loadAllData()
  }, [])

  useEffect(() => {
    if (monitoringPollRef.current) {
      clearInterval(monitoringPollRef.current)
      monitoringPollRef.current = null
    }
    if (monitoringStatus?.monitoring_active && gmailStatus?.is_connected) {
      monitoringPollRef.current = setInterval(() => {
        loadAllData(true)
      }, 60_000)
    }
    return () => {
      if (monitoringPollRef.current) clearInterval(monitoringPollRef.current)
    }
  }, [monitoringStatus?.monitoring_active, gmailStatus?.is_connected])

  const scanCancelledRef = useRef(false)

  const handleCancelScan = () => {
    scanCancelledRef.current = true
    setSyncingGmail(false)
    setOauthBanner({ type: 'error', message: 'Gmail email scan was cancelled.' })
    setTimeout(() => setOauthBanner(null), 4000)
  }

  const handleScanGmailWithOptions = async (limit: number, folder: 'all' | 'inbox' | 'spam' = scanFolder) => {
    scanCancelledRef.current = false
    setSyncingGmail(true)
    try {
      await gmailService.scanInbox(limit, folder)
      if (!scanCancelledRef.current) {
        await loadAllData()
        setActiveTab('emails')
      }
    } catch (err: any) {
      if (!scanCancelledRef.current) {
        alert('Scan failed: ' + (err?.message || 'Network error'))
      }
    } finally {
      setSyncingGmail(false)
    }
  }

  const handleMarkAlert = async (id: string) => {
    try {
      await threatService.markAlertRead(id)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
    } catch (err) {
      console.error(err)
    }
  }

  const totalScanned = emails.length
  const activeThreatsList = threats.filter(t => t.risk_score >= 25 || (t.severity && t.severity !== 'low'))
  const threatCount = activeThreatsList.length
  const criticalCount = threats.filter(t => t.severity === 'critical' || t.risk_score >= 75).length
  const safeCount = Math.max(0, totalScanned - threatCount)
  const unreadAlertsCount = alerts.filter(a => !a.is_read).length

  const userTelemetry = useMemo(
    () => buildUserTelemetry(emails, threats, alerts),
    [emails, threats, alerts]
  )

  const navTabs: NavTabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'gmail-scan', label: 'Gmail Scanner', icon: Mail },
    { id: 'emails', label: 'My Emails', icon: Inbox, count: emails.length },
    { id: 'ai-advisor', label: 'AI Security Advisor', icon: Sparkles },
    { id: 'alerts', label: 'Threat Alerts', icon: AlertTriangle, count: unreadAlertsCount },
    { id: 'history', label: 'Threat History', icon: Clock },
    { id: 'profile', label: 'Profile & Settings', icon: User },
  ]

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--color-text-primary)] flex flex-col md:flex-row font-body">

      {/* ── OAuth Banner ── */}
      {oauthBanner && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold animate-fade-in border max-w-md w-11/12 ${
          oauthBanner.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : 'bg-[#FF1E2D]/10 border-[#FF1E2D]/40 text-[#FF1E2D]'
        }`}>
          {oauthBanner.type === 'success'
            ? <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            : <XCircle size={18} className="text-[#FF1E2D] shrink-0" />}
          <span className="flex-1">{oauthBanner.message}</span>
          <button type="button" onClick={() => setOauthBanner(null)} className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Sidebar ── */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-4">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden gap-1">

            {/* Brand */}
            <div className="flex items-center gap-3 px-1 py-2 mb-5">
              <div className="shrink-0">
                <CyberTraceLogoIcon size={34} className="shrink-0" />
              </div>
              {sidebarOpen && (
                <div className="truncate animate-fade-in">
                  <span className="font-heading text-sm font-extrabold text-[var(--color-text-primary)] tracking-tight block leading-tight">
                    Cyber<span className="text-[#FF1E2D]">Trace</span>
                  </span>
                  <span className="text-[9px] text-[#FF1E2D] font-bold block uppercase tracking-widest mt-0.5">
                    User Portal
                  </span>
                </div>
              )}
            </div>

            {/* Section label */}
            {sidebarOpen && (
              <span className="section-label px-3 mb-1 text-[var(--color-text-muted)] text-[10px] font-bold uppercase tracking-wider">Navigation</span>
            )}

            {/* Nav Links */}
            <div className="flex flex-col gap-0.5">
              {navTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <SidebarLink
                    key={tab.id}
                    link={{
                      label: tab.label,
                      icon: <Icon size={17} />,
                      active: activeTab === tab.id,
                      count: tab.count,
                      onClick: () => setActiveTab(tab.id as any),
                    }}
                  />
                )
              })}
            </div>

            {/* Quick Scan CTA */}
            <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
              <SidebarLink
                link={{
                  label: 'Manual Email Scan',
                  icon: <Sparkles size={17} className="text-[#FF1E2D]" />,
                  onClick: () => setScanModalOpen(true),
                }}
                className="bg-[var(--surface-raised)] hover:bg-[var(--surface-interactive)] border border-[var(--border-primary)] text-[var(--color-text-primary)]"
              />
            </div>
          </div>

          {/* User + Sign Out */}
          <div className="border-t border-[var(--border-primary)] pt-3 flex flex-col gap-0.5">
            <SidebarLink
              link={{
                label: user?.name || 'Profile & Settings',
                icon: user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user?.name || 'User'} className="w-7 h-7 rounded-xl object-cover ring-2 ring-[#FF1E2D]/40" />
                ) : (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#E50914] to-[#8B0000] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {user?.name ? user.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                ),
                active: activeTab === 'profile',
                onClick: () => setActiveTab('profile'),
              }}
            />
            <SidebarLink
              link={{
                label: 'Sign Out',
                icon: <LogOut size={17} className="text-[#FF1E2D]" />,
                onClick: logout,
              }}
              className="hover:bg-[#FF1E2D]/10 hover:text-[#FF1E2D]"
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">

        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[var(--bg-secondary-90)] backdrop-blur-md border-b border-[var(--border-primary)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            {/* Page title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="hidden sm:flex w-7 h-7 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-primary)] items-center justify-center shrink-0">
                {(() => {
                  const tab = navTabs.find(t => t.id === activeTab)
                  const Icon = tab?.icon || Activity
                  return <Icon size={14} className="text-[#FF1E2D]" />
                })()}
              </div>
              <span className="font-heading text-sm font-bold text-[var(--color-text-primary)] truncate">
                {navTabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
              </span>
              <span className="hidden sm:block text-xs text-[var(--color-text-muted)] font-medium">
                · AI Email Threat Intelligence
              </span>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Gmail Status pill */}
              {gmailStatus?.is_connected ? (
                <div title={`Gmail: ${gmailStatus?.email_address}`} className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface-raised)] border border-[var(--border-primary)] text-[var(--color-text-primary)] items-center gap-2 hidden sm:flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate max-w-[150px]">{gmailStatus?.email_address || 'Connected'}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  title="Gmail is disconnected — click to connect"
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FF1E2D]/10 border border-[#FF1E2D]/30 text-[#FF1E2D] flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF1E2D]" />
                  <span className="hidden sm:block">Gmail: Disconnected</span>
                  <span className="sm:hidden">Disconnected</span>
                </button>
              )}

              {/* Notifications */}
              <NotificationsWithActions
                items={notifications}
                onDelete={removeNotification}
                onArchive={archiveNotification}
                placement="bottom"
              />

              {/* Manual Scan */}
              <button
                type="button"
                onClick={() => setScanModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E50914] hover:bg-[#FF1E2D] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Sparkles size={13} />
                <span className="hidden sm:block">Scan Email</span>
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Refresh */}
              <button
                type="button"
                onClick={() => loadAllData()}
                disabled={loading}
                title="Refresh data"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-[#FF1E2D] hover:bg-[var(--surface-raised)] border border-[var(--border-primary)] transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>

              {/* Sign Out */}
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-[#FF1E2D] hover:bg-[#FF1E2D]/10 border border-[var(--border-primary)] hover:border-[#FF1E2D]/30 transition-all cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* ── Main Body ── */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">

          {/* ══ TAB: DASHBOARD ══ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">

              {/* Active Scan Indicator */}
              {syncingGmail && (
                <div className="p-4 rounded-2xl bg-[#111111] border border-[#FF1E2D]/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#181818] border border-[#2A2A2A] text-[#FF1E2D] flex items-center justify-center shrink-0">
                      <RefreshCw size={17} className="animate-spin" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#F5F5F5] block">Scanning Gmail Inbox ({scanFolder})…</span>
                      <span className="text-xs text-[#A3A3A3] font-medium">Extracting headers, evaluating SPF/DKIM & classifying threats</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelScan}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF1E2D]/15 hover:bg-[#FF1E2D]/25 text-[#FF1E2D] border border-[#FF1E2D]/30 text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    <X size={13} />
                    Cancel Scan
                  </button>
                </div>
              )}

              {/* Defense Overview Banner */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#111111] border border-[#2A2A2A] shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FF1E2D]/10 text-[#FF1E2D] border border-[#FF1E2D]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF1E2D] animate-pulse" />
                        Real-Time SOC Defense Active
                      </span>
                    </div>
                    <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
                      Defense Overview
                    </h1>
                    <p className="text-sm text-[#A3A3A3] mt-1 font-medium">
                      AI-powered NLP analysis, DKIM/SPF domain validation & heuristic threat triage running continuously.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('gmail-scan')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#181818] hover:bg-[#222222] text-[#F5F5F5] border border-[#2A2A2A] text-xs font-bold transition-all cursor-pointer"
                    >
                      <Mail size={13} />
                      Open Gmail Scanner
                    </button>
                    <button
                      type="button"
                      onClick={() => loadAllData()}
                      disabled={loading}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-[#A3A3A3] hover:text-[#FF1E2D] hover:bg-[#181818] border border-[#2A2A2A] transition-all cursor-pointer"
                    >
                      <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {/* Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#2A2A2A]">
                  <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] border-l-4 border-l-[#737373]">
                    <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-2">Total Scanned</span>
                    <span className="font-heading text-3xl font-extrabold text-[#F5F5F5] block">{totalScanned}</span>
                    <span className="text-xs text-[#737373] font-medium mt-1 block">emails analyzed</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] border-l-4 border-l-[#FF5A36]">
                    <span className="text-[10px] font-bold text-[#FF5A36] uppercase tracking-wider block mb-2">Active Threats</span>
                    <span className="font-heading text-3xl font-extrabold text-[#FF5A36] block">{threatCount}</span>
                    <span className="text-xs text-[#FF5A36]/70 font-medium mt-1 block">requires attention</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] border-l-4 border-l-[#FF1E2D]">
                    <span className="text-[10px] font-bold text-[#FF1E2D] uppercase tracking-wider block mb-2">Critical</span>
                    <span className="font-heading text-3xl font-extrabold text-[#FF1E2D] block">{criticalCount}</span>
                    <span className="text-xs text-[#FF1E2D]/70 font-medium mt-1 block">high-risk score ≥75</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] border-l-4 border-l-emerald-500">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">Clean & Safe</span>
                    <span className="font-heading text-3xl font-extrabold text-emerald-400 block">{safeCount}</span>
                    <span className="text-xs text-emerald-500/70 font-medium mt-1 block">no threats found</span>
                  </div>
                </div>
              </div>

              {/* Analytics Chart */}
              <div className="overflow-hidden">
                <IncidentReportCard
                  title="Threat Intelligence & Email Ingestion Telemetry"
                  chartSeries={userTelemetry.chartSeries}
                  metrics={userTelemetry.metrics}
                />
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Threat Feed */}
                <div className="lg:col-span-2 p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#181818] border border-[#2A2A2A] flex items-center justify-center">
                        <ShieldAlert size={16} className="text-[#FF1E2D]" />
                      </div>
                      <div>
                        <h2 className="font-heading text-sm font-bold text-[#F5F5F5]">Recent Threat Detections</h2>
                        <span className="text-xs text-[#737373] font-medium">Latest flagged emails</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('emails')}
                      className="flex items-center gap-1 text-xs font-bold text-[#FF1E2D] hover:underline cursor-pointer"
                    >
                      View all ({emails.length}) <ChevronRight size={13} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {threats.length > 0 ? threats.slice(0, 5).map(t => {
                      const sc = sevClass(t.severity)
                      const sev = sevColors[sc]
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedThreatId(t.id)}
                          className="p-4 rounded-2xl bg-[#181818] hover:bg-[#1E1E1E] border border-[#2A2A2A] hover:border-[#FF1E2D]/40 transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${sev.bg} ${sev.text} ${sev.border}`}>
                                  {t.severity}
                                </span>
                                <span className="font-heading text-sm font-bold text-[#F5F5F5] truncate">{t.threat_type}</span>
                                {t.is_demo && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/30">DEMO</span>}
                              </div>
                              <p className="text-xs text-[#A3A3A3] line-clamp-1 font-medium">{t.summary}</p>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0 self-center">
                              <div className="text-right">
                                <span className="text-sm font-extrabold text-[#FF1E2D] block">{t.risk_score}<span className="text-xs font-medium text-[#737373]">/100</span></span>
                                <span className="text-[10px] text-[#737373] block">
                                  {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <Eye size={15} className="text-[#737373]" />
                            </div>
                          </div>
                        </div>
                      )
                    }) : (
                      <div className="py-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                          <Shield size={22} className="text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#F5F5F5]">No active threats detected</p>
                          <p className="text-xs text-[#737373] mt-0.5">Your inbox looks clean!</p>
                        </div>
                        {gmailStatus?.is_connected && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('gmail-scan')}
                            className="text-xs font-bold text-[#FF1E2D] hover:underline cursor-pointer"
                          >
                            Open Gmail Scanner →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Alerts Panel */}
                <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FF5A36]/10 border border-[#FF5A36]/30 flex items-center justify-center">
                        <Bell size={15} className="text-[#FF5A36]" />
                      </div>
                      <div>
                        <h2 className="font-heading text-sm font-bold text-[#F5F5F5]">Security Alerts</h2>
                        {unreadAlertsCount > 0 && (
                          <span className="text-[10px] font-bold text-[#FF5A36]">{unreadAlertsCount} unread</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 max-h-[320px] overflow-y-auto pr-1">
                    {alerts.length > 0 ? alerts.slice(0, 8).map(a => {
                      const sc = sevClass(a.severity)
                      const sev = sevColors[sc]
                      return (
                        <div
                          key={a.id}
                          className={`p-3 rounded-2xl border transition-all ${
                            a.is_read
                              ? 'bg-[#181818] border-[#2A2A2A] opacity-70'
                              : `${sev.bg} ${sev.border} shadow-xs`
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${sev.dot}`} />
                              <span className="font-bold text-xs text-[#F5F5F5] leading-tight line-clamp-1">{a.title}</span>
                            </div>
                            {!a.is_read && (
                              <button
                                type="button"
                                onClick={() => handleMarkAlert(a.id)}
                                className="text-[10px] font-bold text-[#FF1E2D] hover:underline cursor-pointer shrink-0"
                              >
                                Read
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-[#A3A3A3] mt-1 leading-snug line-clamp-2 pl-3.5">{a.message}</p>
                        </div>
                      )
                    }) : (
                      <div className="py-10 text-center space-y-2">
                        <CheckCircle size={24} className="text-emerald-400 mx-auto" />
                        <p className="text-xs text-[#737373] font-medium">All clear — no active alerts</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[#2A2A2A] mt-4">
                    <button
                      type="button"
                      onClick={() => setScanModalOpen(true)}
                      className="w-full py-2.5 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] text-xs font-bold text-[#FF1E2D] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={13} />
                      Launch Manual Scanner
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: MY EMAILS ══ */}
          {activeTab === 'emails' && (
            <div className="space-y-5 animate-fade-in">
              {/* Page header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-heading text-2xl font-extrabold text-[#F5F5F5]">Mailbox Intelligence</h1>
                  <p className="text-sm text-[#A3A3A3] mt-0.5">{emails.length} emails analyzed by CyberTrace threat engine</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setActiveTab('dashboard')} className="text-xs font-bold text-[#FF1E2D] hover:underline cursor-pointer">
                    ← Dashboard
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] space-y-5">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2A2A2A]">
                  <div className="flex items-center gap-2">
                    {/* Folder filter */}
                    <div className="flex items-center rounded-xl bg-[#181818] border border-[#2A2A2A] p-1 text-[11px] font-bold">
                      {(['all', 'inbox', 'spam'] as const).map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setScanFolder(f)}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer capitalize ${
                            scanFolder === f
                              ? 'bg-[#E50914] text-white shadow-sm'
                              : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scan count buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#737373]">Quick scan:</span>
                    {[1, 5, 10, 25].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        disabled={syncingGmail}
                        onClick={() => handleScanGmailWithOptions(cnt, scanFolder)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#181818] hover:bg-[#E50914] hover:text-white text-[#F5F5F5] border border-[#2A2A2A] transition-all cursor-pointer disabled:opacity-50"
                      >
                        {cnt} emails
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setScanModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#E50914] text-white hover:bg-[#FF1E2D] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Sparkles size={12} />
                      Paste Raw Email
                    </button>
                  </div>
                </div>

                {/* Table */}
                <EmailsDataTable
                  emails={emails}
                  threats={threats}
                  onSelectEmail={(e) => setSelectedEmail(e)}
                  selectedEmailId={selectedEmail?.id}
                />
              </div>

              {/* Email Detail Card */}
              {selectedEmail && (
                <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] space-y-4 animate-slide-in-up">
                  <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#181818] border border-[#2A2A2A] flex items-center justify-center">
                        <Mail size={15} className="text-[#FF1E2D]" />
                      </div>
                      <h3 className="font-heading text-sm font-bold text-[#F5F5F5]">Email Content Inspector</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setAdvisorSelectedEmailId(selectedEmail.id); setActiveTab('ai-advisor') }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#E50914] to-[#8B0000] text-white text-xs font-bold hover:brightness-110 transition-all shadow-sm cursor-pointer"
                      >
                        <Sparkles size={12} />
                        Ask AI Advisor
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedEmail(null)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#737373] hover:text-[#F5F5F5] hover:bg-[#181818] transition-all cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Subject', value: selectedEmail.subject },
                        { label: 'From', value: selectedEmail.sender },
                        { label: 'Source IP', value: selectedEmail.headers?.source_ip || '—', highlight: true },
                      ].map(({ label, value, highlight }) => (
                        <div key={label} className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A]">
                          <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1">{label}</span>
                          <span className={`font-semibold ${highlight ? 'text-[#FF1E2D] font-bold' : 'text-[#F5F5F5]'} truncate block`}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1.5">Email Body</span>
                      <pre className="p-4 rounded-2xl bg-[#0A0A0A] border border-[#2A2A2A] font-mono text-xs whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed text-[#F5F5F5]">
                        {selectedEmail.plain_text_body || '(No body text)'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: AI ADVISOR ══ */}
          {activeTab === 'ai-advisor' && (
            <div className="animate-fade-in">
              <UserRAGAssistant
                emails={emails}
                selectedEmailId={advisorSelectedEmailId}
              />
            </div>
          )}

          {/* ══ TAB: ALERTS ══ */}
          {activeTab === 'alerts' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-heading text-2xl font-extrabold text-[#F5F5F5]">Security Alert History</h1>
                  <p className="text-sm text-[#A3A3A3] mt-0.5">{alerts.length} total alerts · {unreadAlertsCount} unread</p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] space-y-3">
                {alerts.length > 0 ? alerts.map(a => {
                  const sc = sevClass(a.severity)
                  const sev = sevColors[sc]
                  return (
                    <div
                      key={a.id}
                      className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all stagger-item ${
                        a.is_read
                          ? 'bg-[#181818] border-[#2A2A2A] opacity-70'
                          : `${sev.bg} ${sev.border} shadow-xs`
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sev.dot}`} />
                        <div className="space-y-0.5 min-w-0">
                          <span className="font-bold text-sm text-[#F5F5F5] block">{a.title}</span>
                          <p className="text-xs text-[#A3A3A3] leading-relaxed">{a.message}</p>
                          <span className="text-[10px] text-[#737373] block font-medium pt-1">
                            {new Date(a.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${sev.bg} ${sev.text} ${sev.border}`}>
                          {a.severity}
                        </span>
                        {!a.is_read && (
                          <button
                            type="button"
                            onClick={() => handleMarkAlert(a.id)}
                            className="text-[10px] font-bold text-[#FF1E2D] hover:underline cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  )
                }) : (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                      <Shield size={26} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#F5F5F5]">No security alerts yet</p>
                      <p className="text-xs text-[#737373] mt-0.5">Alerts will appear when threats are detected</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB: HISTORY ══ */}
          {activeTab === 'history' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h1 className="font-heading text-2xl font-extrabold text-[#F5F5F5]">Threat Audit History</h1>
                <p className="text-sm text-[#A3A3A3] mt-0.5">{threats.length} recorded threat incidents</p>
              </div>

              <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A]">
                <div className="divide-y divide-[#2A2A2A]">
                  {threats.length > 0 ? threats.map((t, idx) => {
                    const sc = sevClass(t.severity)
                    const sev = sevColors[sc]
                    return (
                      <div key={t.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ animationDelay: `${idx * 40}ms` }}>
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sev.dot}`} />
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-[#F5F5F5]">{t.threat_type}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${sev.bg} ${sev.text} ${sev.border}`}>
                                {t.severity}
                              </span>
                              {t.is_demo && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/30">DEMO</span>}
                            </div>
                            <p className="text-xs text-[#A3A3A3] font-medium line-clamp-1">{t.summary}</p>
                            <span className="text-[10px] text-[#737373] block font-medium">
                              Recorded: {new Date(t.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="text-right">
                            <span className="font-heading text-base font-extrabold text-[#FF1E2D]">{t.risk_score}<span className="text-xs font-medium text-[#737373]">/100</span></span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedThreatId(t.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181818] border border-[#2A2A2A] text-xs font-bold text-[#FF1E2D] hover:bg-[#E50914] hover:text-white transition-all cursor-pointer"
                          >
                            <Eye size={12} />
                            Forensics
                          </button>
                        </div>
                      </div>
                    )
                  }) : (
                    <div className="py-16 text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#181818] border border-[#2A2A2A] flex items-center justify-center mx-auto">
                        <Clock size={26} className="text-[#FF1E2D]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#F5F5F5]">No threat history yet</p>
                        <p className="text-xs text-[#737373] mt-0.5">Scan your inbox to begin threat detection</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: GMAIL SCANNER ══ */}
          {activeTab === 'gmail-scan' && (
            <GmailScannerView
              gmailStatus={gmailStatus}
              monitoringStatus={monitoringStatus}
              threats={threats}
              onRefreshAllData={loadAllData}
              onNavigateToProfile={() => setActiveTab('profile')}
              onNavigateToEmails={() => setActiveTab('emails')}
              onViewThreatReport={(tId) => setSelectedThreatId(tId)}
            />
          )}

          {/* ══ TAB: PROFILE ══ */}
          {activeTab === 'profile' && (
            <UserProfileView
              gmailStatus={gmailStatus}
              monitoringStatus={monitoringStatus}
              onRefreshGmailStatus={loadAllData}
            />
          )}
        </main>

        {/* Manual Scan Modal */}
        <ManualScanModal
          isOpen={scanModalOpen}
          onClose={() => setScanModalOpen(false)}
          onScanCompleted={() => { loadAllData() }}
        />

        {/* Forensics Modal */}
        <ForensicsModal
          threatId={selectedThreatId}
          onClose={() => setSelectedThreatId(null)}
          onStatusUpdated={loadAllData}
        />

        {/* Gmail Scanning Loader */}
        {syncingGmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="relative w-full max-w-sm rounded-3xl bg-[#111111] p-8 shadow-2xl border border-[#FF1E2D]/30 flex flex-col items-center text-center">
              <CoreSpinLoader customStates={[
                'Connecting Inbox…',
                'Fetching Emails…',
                'Extracting Headers…',
                'Checking IP Reputation…',
                'Running AI Analysis…',
                'Generating Analytics…'
              ]} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard
