import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  ShieldAlert, Mail, Sparkles, RefreshCw, AlertTriangle,
  Eye, Clock, Activity, LogOut, ChevronRight, Inbox, Search, CheckCircle, XCircle, X,
  User
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

interface NavTabItem {
  id: 'dashboard' | 'gmail-scan' | 'emails' | 'ai-advisor' | 'alerts' | 'history' | 'profile'
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  count?: number
}

export const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth()
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
  const [emailSearch, setEmailSearch] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const monitoringPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // OAuth return banner state
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
      // Keep selected email updated with latest data if one is open
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
    // Detect OAuth return params (?gmail_connected=true or ?error=...)
    if (!oauthHandled.current) {
      oauthHandled.current = true
      const params = new URLSearchParams(window.location.search)
      const connected = params.get('gmail_connected')
      const oauthError = params.get('error')

      if (connected === 'true') {
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, '', cleanUrl)

        setOauthBanner({ type: 'success', message: 'Gmail connected successfully! You can now scan your inbox or enable automatic monitoring.' })
        loadAllData().then(() => setActiveTab('dashboard'))
        setTimeout(() => setOauthBanner(null), 6000)
        return
      }

      if (oauthError) {
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, '', cleanUrl)
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

  // Poll monitoring status silently every 60s while monitoring is active (non-disruptive background sync)
  useEffect(() => {
    if (monitoringPollRef.current) {
      clearInterval(monitoringPollRef.current)
      monitoringPollRef.current = null
    }
    if (monitoringStatus?.monitoring_active && gmailStatus?.is_connected) {
      monitoringPollRef.current = setInterval(() => {
        // Run silent background update — no UI flickers, no modal closure, no scroll reset
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

  // Consistent, verified metric calculations
  const totalScanned = emails.length
  const activeThreatsList = threats.filter(t => t.risk_score >= 25 || (t.severity && t.severity !== 'low'))
  const threatCount = activeThreatsList.length
  const criticalCount = threats.filter(t => t.severity === 'critical' || t.risk_score >= 75).length
  const safeCount = Math.max(0, totalScanned - threatCount)
  const unreadAlertsCount = alerts.filter(a => !a.is_read).length

  // Live Dynamic Telemetry & Chart Metrics computed directly from user's analytics
  const userTelemetry = useMemo(
    () => buildUserTelemetry(emails, threats, alerts),
    [emails, threats, alerts]
  )

  // Helper to sanitize raw divider ASCII strings from text bodies
  const cleanSnippet = (text?: string) => {
    if (!text) return '(empty preview)'
    return text.replace(/-{3,}/g, '').replace(/\s+/g, ' ').trim()
  }

  const filteredEmails = emails.filter(e => {
    if (!emailSearch) return true
    const q = emailSearch.toLowerCase()
    return (
      e.subject.toLowerCase().includes(q) ||
      e.sender.toLowerCase().includes(q) ||
      (e.plain_text_body || '').toLowerCase().includes(q)
    )
  })

  const navTabs: NavTabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'gmail-scan', label: 'Gmail Scanner', icon: Mail },
    { id: 'emails', label: 'My Emails', icon: Inbox, count: emails.length },
    { id: 'ai-advisor', label: 'AI Security Advisor', icon: Sparkles },
    { id: 'alerts', label: 'Threat Alerts', icon: AlertTriangle, count: unreadAlertsCount },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'profile', label: 'Profile Settings', icon: User },
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#192837] flex flex-col md:flex-row font-body selection:bg-[#7342E2]/20 selection:text-[#7342E2]">
      {/* OAuth Banner Notification */}
      {oauthBanner && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold transition-all animate-fade-in border max-w-md w-11/12 ${
            oauthBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {oauthBanner.type === 'success'
            ? <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            : <XCircle size={18} className="text-red-600 shrink-0" />}
          <span className="flex-1">{oauthBanner.message}</span>
          <button
            type="button"
            onClick={() => setOauthBanner(null)}
            className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Left Collapsible Animated Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-6">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo / Brand Header */}
            <div className="flex items-center gap-3 px-1 py-2 mb-4">
              <CyberTraceLogoIcon size={36} className="shrink-0" />
              {sidebarOpen && (
                <div className="truncate">
                  <span className="font-heading text-base font-extrabold text-[#192837] tracking-tight block">
                    Cyber<span className="text-[#7342E2]">Trace</span>
                  </span>
                  <span className="text-[10px] text-[#7342E2] font-bold block uppercase tracking-wider">
                    User Portal
                  </span>
                </div>
              )}
            </div>

            {/* Sidebar Navigation Links */}
            <div className="flex flex-col gap-1.5">
              {navTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <SidebarLink
                    key={tab.id}
                    link={{
                      label: tab.label,
                      icon: <Icon size={18} />,
                      active: activeTab === tab.id,
                      count: tab.count,
                      onClick: () => setActiveTab(tab.id as any),
                    }}
                  />
                )
              })}
            </div>

            {/* Quick Manual Scan in Sidebar */}
            <div className="mt-4 pt-3 border-t border-[#192837]/10">
              <SidebarLink
                link={{
                  label: "Manual Scan",
                  icon: <Sparkles size={18} className="text-[#7342E2]" />,
                  onClick: () => setScanModalOpen(true),
                }}
                className="bg-[#7342E2]/10 hover:bg-[#7342E2]/20 text-[#7342E2] font-semibold"
              />
            </div>
          </div>

          {/* User Profile & Sign Out at Bottom */}
          <div className="border-t border-[#192837]/10 pt-3">
            <SidebarLink
              link={{
                label: user?.name || "Profile & Settings",
                icon: user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user?.name || "User"}
                    className="w-7 h-7 rounded-xl object-cover ring-2 ring-[#7342E2]/40 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-xl bg-[#7342E2] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-transparent hover:ring-[#7342E2]/30 transition-all">
                    {user?.name ? user.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : "U"}
                  </div>
                ),
                active: activeTab === 'profile',
                onClick: () => setActiveTab('profile'),
              }}
              className="cursor-pointer hover:bg-[#7342E2]/10"
            />
            <SidebarLink
              link={{
                label: "Sign Out",
                icon: <LogOut size={18} className="text-red-500" />,
                onClick: logout,
              }}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar Header with Live Red / Green Gmail Status Indicator */}
        <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#192837]/10 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="font-heading text-base font-extrabold text-[#192837]">
                {navTabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
              </span>
              <span className="text-[11px] text-[#192837]/50 hidden sm:inline">
                &bull; AI Email Threat Intelligence
              </span>
            </div>

            {/* Actions & Gmail Live Red/Green Indicator */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Global Gmail Connection Status Light */}
              {gmailStatus?.is_connected ? (
                <div
                  title={`Gmail Authorized: ${gmailStatus?.email_address || user?.email}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs cursor-default"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm animate-pulse shrink-0" />
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">
                    Gmail: {gmailStatus?.email_address || 'Connected'}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  title="Gmail is disconnected. Click to connect in Profile & Settings"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shrink-0" />
                  <span>Gmail: Disconnected</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setScanModalOpen(true)}
                className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8B5CF6] to-[#7342E2] hover:brightness-110 active:scale-95 shadow-md shadow-[#7342E2]/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Sparkles size={14} />
                <span>Manual Scan</span>
              </button>

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#192837]/60 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer shrink-0"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">

        {/* Compact Strip Header for Inner Tabs */}
        {activeTab !== 'dashboard' && activeTab !== 'profile' && activeTab !== 'gmail-scan' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#192837]/10 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-[#192837]">
                {activeTab === 'emails' && `Mailbox Overview (${emails.length} Analyzed Emails)`}
                {activeTab === 'alerts' && `Security Alert Logs (${alerts.length} Total Alerts)`}
                {activeTab === 'history' && `Threat Audit History (${threats.length} Recorded Items)`}
                {activeTab === 'ai-advisor' && `AI Cybersecurity Assistant & RAG Copilot`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#192837]/10 text-[#192837]/70 font-semibold">
                Threats: <b className="text-orange-600 font-bold">{threatCount}</b>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#192837]/10 text-[#192837]/70 font-semibold">
                Safe: <b className="text-emerald-600 font-bold">{safeCount}</b>
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="text-xs font-bold text-[#7342E2] hover:underline cursor-pointer ml-1"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        )}


        {/* TAB 1: MAIN DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <>
            {/* Active Scanning Indicator with Cancel Option */}
            {syncingGmail && (
              <div className="p-4 rounded-3xl bg-gradient-to-r from-[#FAF8FF] via-white to-[#F5F3FF] border border-[#7342E2]/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#7342E2]/10 border border-[#7342E2]/25 text-[#7342E2] flex items-center justify-center shrink-0">
                    <RefreshCw size={18} className="animate-spin" />
                  </div>
                  <div>
                    <span className="font-heading font-extrabold text-xs sm:text-sm text-[#192837] block">
                      Scanning Gmail Inbox ({scanFolder})...
                    </span>
                    <span className="text-[11px] text-[#192837]/60 font-medium">
                      Extracting headers, evaluating SPF/DKIM authentication & classifying threats.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelScan}
                  className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <X size={14} />
                  <span>Cancel Scan</span>
                </button>
              </div>
            )}

            {/* Top Defense Overview Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#192837]/10 shadow-xs flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#7342E2]/10 text-[#7342E2]">
                    Real-Time SOC Defense Active
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('gmail-scan')}
                      className="px-3.5 py-1.5 rounded-xl bg-[#7342E2]/10 hover:bg-[#7342E2]/20 text-[#7342E2] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Mail size={14} />
                      <span>Open Gmail Scanner</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadAllData()}
                      disabled={loading}
                      title="Refresh threat intelligence"
                      className="p-2 rounded-xl bg-[#FAF9F6] border border-[#192837]/10 text-[#192837]/70 hover:text-[#7342E2] hover:bg-white transition-all cursor-pointer"
                    >
                      <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#192837] tracking-tight mt-3">
                  Defense Overview
                </h1>
                <p className="text-xs sm:text-sm text-[#192837]/70 mt-1 font-medium leading-relaxed">
                  AI-powered NLP analysis, DKIM/SPF domain validation & heuristic threat triage running continuously.
                </p>
              </div>

              {/* Key Metrics Widgets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#192837]/8">
                <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/6">
                  <span className="text-[10px] font-bold text-[#192837]/60 uppercase tracking-wider block">Total Scanned</span>
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-[#192837] mt-0.5 block">{totalScanned}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/6">
                  <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">Active Threats</span>
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-orange-600 mt-0.5 block">{threatCount}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/6">
                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Critical</span>
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-red-600 mt-0.5 block">{criticalCount}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/6">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Clean & Safe</span>
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-600 mt-0.5 block">{safeCount}</span>
                </div>
              </div>
            </div>

            {/* Incident & Threat Intelligence Analysis Section (Dynamic User Analytics) */}
            <div className="w-full">
              <IncidentReportCard
                title="Threat Intelligence & Email Ingestion Telemetry"
                chartSeries={userTelemetry.chartSeries}
                metrics={userTelemetry.metrics}
              />
            </div>

            {/* Bottom Grid: Recent Threats + Security Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Threat Detections Feed */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert size={20} className="text-[#7342E2]" />
                    <h2 className="font-heading text-base font-bold text-[#192837]">
                      Recent Threat Detections
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('emails')}
                    className="text-xs font-bold text-[#7342E2] hover:underline cursor-pointer"
                  >
                    View All Emails ({emails.length}) →
                  </button>
                </div>

                <div className="space-y-3">
                  {threats.length > 0 ? threats.slice(0, 5).map(t => {
                    const sevColor =
                      t.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                      t.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      t.severity === 'medium' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      'bg-emerald-50 text-emerald-800 border-emerald-200'

                    const formattedTime = new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedThreatId(t.id)}
                        className="p-4 rounded-2xl bg-[#FAF9F6] hover:bg-white border border-[#192837]/8 hover:border-[#7342E2]/40 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${sevColor}`}>
                              {t.severity}
                            </span>
                            <span className="font-heading text-sm font-bold text-[#192837] truncate">
                              {t.threat_type}
                            </span>
                            {t.is_demo && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                                DEMO
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#192837]/80 line-clamp-1 font-medium">
                            {t.summary}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-[#7342E2] block">
                              {t.risk_score}/100
                            </span>
                            <span className="text-[10px] text-[#192837]/50 font-medium whitespace-nowrap block">
                              {formattedTime}
                            </span>
                          </div>
                          <Eye size={16} className="text-[#192837]/40" />
                        </div>
                      </div>
                    )
                  }) : (
                    <div className="py-12 text-center text-xs text-[#192837]/50 space-y-2">
                      <p>No active threats detected yet.</p>
                      {gmailStatus?.is_connected && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('gmail-scan')}
                          className="text-xs font-bold text-[#7342E2] hover:underline cursor-pointer"
                        >
                          Open Gmail Scanner now →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Live Security Alerts */}
              <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={19} className="text-orange-500" />
                      <h2 className="font-heading text-base font-bold text-[#192837]">
                        Security Alerts
                      </h2>
                    </div>
                    <span className="text-xs font-bold text-[#192837]/60">
                      {unreadAlertsCount} unread
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {alerts.length > 0 ? alerts.map(a => (
                      <div
                        key={a.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          a.is_read
                            ? 'bg-[#FAF9F6] border-[#192837]/6 opacity-60'
                            : 'bg-red-50/60 border-red-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-[#192837] block leading-tight">
                            {a.title}
                          </span>
                          {!a.is_read && (
                            <button
                              type="button"
                              onClick={() => handleMarkAlert(a.id)}
                              className="text-[10px] font-bold text-[#7342E2] hover:underline cursor-pointer shrink-0"
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-[#192837]/75 mt-1 leading-normal line-clamp-2">
                          {a.message}
                        </p>
                      </div>
                    )) : (
                      <div className="py-12 text-center text-xs text-[#192837]/50">
                        All clean! No active inbox security alerts.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#192837]/8">
                  <button
                    type="button"
                    onClick={() => setScanModalOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#7342E2]/10 border border-[#192837]/10 text-xs font-bold text-[#7342E2] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={14} />
                    <span>Launch Manual Scanner</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: MY EMAILS VIEW */}
        {activeTab === 'emails' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-6">
              {/* Header Controls Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#192837]/8">
                <div>
                  <h2 className="font-heading text-xl font-extrabold text-[#192837]">
                    Mailbox Intelligence ({emails.length})
                  </h2>
                  <p className="text-xs text-[#192837]/70 mt-0.5 font-medium">
                    Filter and inspect scanned emails analyzed by CyberTrace threat engine
                  </p>
                </div>

                {/* Scan Options Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-xl bg-[#FAF9F6] border border-[#192837]/10 p-1 text-[11px] font-bold">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'inbox', label: 'Inbox' },
                      { id: 'spam', label: 'Spam' },
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setScanFolder(f.id as any)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          scanFolder === f.id
                            ? 'bg-[#192837] text-white shadow-xs'
                            : 'text-[#192837]/65 hover:text-[#192837]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs font-bold text-[#192837]/60">Scan:</span>
                  {[1, 5, 10, 25].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      disabled={syncingGmail}
                      onClick={() => handleScanGmailWithOptions(cnt, scanFolder)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#7342E2]/10 hover:bg-[#7342E2] hover:text-white text-[#7342E2] border border-[#7342E2]/20 transition-all cursor-pointer"
                    >
                      {cnt}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setScanModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#7342E2] text-white hover:brightness-110 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles size={13} />
                    <span>Paste Raw</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  placeholder="Search by subject, sender email, or body text snippet..."
                  className="w-full text-xs sm:text-sm px-4 py-2.5 pl-10 rounded-2xl bg-[#FAF9F6] border border-[#192837]/15 focus:outline-none focus:bg-white focus:border-[#7342E2] transition-all"
                />
                <Search size={17} className="absolute left-3.5 top-3 text-[#192837]/40" />
              </div>

              {/* Email Items List */}
              <div className="space-y-3">
                {filteredEmails.length > 0 ? filteredEmails.map(e => {
                  const matchingThreat = threats.find(t => t.email_id === e.id)
                  const cleanBodySnippet = cleanSnippet(e.plain_text_body || e.snippet)

                  return (
                    <div
                      key={e.id}
                      onClick={() => setSelectedEmail(e)}
                      className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        selectedEmail?.id === e.id
                          ? 'bg-[#7342E2]/5 border-[#7342E2] shadow-sm'
                          : 'bg-[#FAF9F6] hover:bg-white border-[#192837]/8 hover:border-[#7342E2]/30 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {matchingThreat ? (
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                              matchingThreat.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                              matchingThreat.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              matchingThreat.severity === 'medium' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {matchingThreat.severity} — {matchingThreat.threat_type}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Verified Clean
                            </span>
                          )}

                          <span className="font-heading text-sm font-bold text-[#192837] truncate">
                            {e.subject}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#192837]/75 font-medium flex-wrap">
                          <span>From: <b className="text-[#192837] font-semibold">{e.sender}</b></span>
                          {e.headers?.spf && (
                            <span className="text-[10px] uppercase font-bold text-[#7342E2] bg-[#7342E2]/10 px-1.5 py-0.5 rounded">
                              SPF: {e.headers.spf}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#192837]/70 line-clamp-1 font-normal">
                          {cleanBodySnippet}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className="text-[11px] text-[#192837]/50 font-medium whitespace-nowrap">
                          {new Date(e.date).toLocaleDateString()}
                        </span>
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation()
                            setAdvisorSelectedEmailId(e.id)
                            setActiveTab('ai-advisor')
                          }}
                          className="px-2.5 py-1 rounded-xl bg-cyan-50 border border-cyan-200 text-xs font-bold text-cyan-700 hover:bg-cyan-600 hover:text-white transition-all cursor-pointer shadow-xs flex items-center gap-1"
                        >
                          <Sparkles size={13} />
                          AI Explain
                        </button>
                        {matchingThreat && (
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              setSelectedThreatId(matchingThreat.id)
                            }}
                            className="px-3 py-1 rounded-xl bg-white border border-[#192837]/15 text-xs font-bold text-[#7342E2] hover:bg-[#7342E2] hover:text-white transition-all cursor-pointer shadow-xs"
                          >
                            Forensics
                          </button>
                        )}
                        <ChevronRight size={16} className="text-[#192837]/30" />
                      </div>
                    </div>
                  )
                }) : (
                  <div className="py-16 text-center text-xs text-[#192837]/50 space-y-3">
                    <Inbox size={34} className="mx-auto text-[#192837]/30" />
                    <p className="text-sm font-medium">No emails ingested yet.</p>
                    <p>Select a scan range button above (e.g. 5) to scan Gmail!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Email Detail Drawer Modal/Panel */}
            {selectedEmail && (
              <div className="p-6 rounded-3xl bg-white border border-[#7342E2]/30 shadow-lg space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-[#192837]/10">
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-[#7342E2]" />
                    <h3 className="font-heading text-base font-bold text-[#192837]">
                      Email Content Inspector
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAdvisorSelectedEmailId(selectedEmail.id)
                        setActiveTab('ai-advisor')
                      }}
                      className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:from-cyan-500 hover:to-blue-500 transition-all shadow-xs cursor-pointer"
                    >
                      <Sparkles size={13} />
                      Ask AI Advisor
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedEmail(null)}
                      className="text-xs font-bold text-[#192837]/50 hover:text-[#192837] cursor-pointer"
                    >
                      Close Preview ✕
                    </button>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/8 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-bold text-[#192837]/60">Subject:</span>
                      <span className="font-semibold text-[#192837]">{selectedEmail.subject}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-bold text-[#192837]/60">From:</span>
                      <span className="text-[#192837] font-medium">{selectedEmail.sender}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-bold text-[#192837]/60">Source IP:</span>
                      <span className="text-[#7342E2] font-bold">{selectedEmail.headers?.source_ip || '185.220.101.5'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-[#192837]/70 block mb-1">Body Text Content:</span>
                    <pre className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/10 font-mono text-xs whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed text-[#192837]">
                      {selectedEmail.plain_text_body || '(No body text)'}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI SECURITY ADVISOR (USER RAG) */}
        {activeTab === 'ai-advisor' && (
          <div className="space-y-4">
            <UserRAGAssistant
              emails={emails}
              selectedEmailId={advisorSelectedEmailId}
            />
          </div>
        )}

        {/* TAB 4: THREAT ALERTS VIEW */}
        {activeTab === 'alerts' && (
          <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#192837]/8">
              <h2 className="font-heading text-lg font-extrabold text-[#192837]">
                Security Alert History ({alerts.length})
              </h2>
              <span className="text-xs font-semibold text-[#192837]/60">
                {unreadAlertsCount} unread
              </span>
            </div>

            <div className="space-y-3">
              {alerts.length > 0 ? alerts.map(a => (
                <div
                  key={a.id}
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                    a.is_read ? 'bg-[#FAF9F6] border-[#192837]/8 opacity-75' : 'bg-red-50/50 border-red-200 shadow-xs'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-[#192837] block">{a.title}</span>
                    <p className="text-xs text-[#192837]/80 leading-relaxed">{a.message}</p>
                    <span className="text-[10px] text-[#192837]/40 block pt-1 font-medium">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xs font-bold uppercase text-red-600 bg-red-100/60 px-2.5 py-1 rounded-lg">
                      {a.severity}
                    </span>
                    {!a.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAlert(a.id)}
                        className="text-xs font-bold text-[#7342E2] hover:underline cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-xs text-[#192837]/50">
                  No security alerts generated yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT HISTORY VIEW */}
        {activeTab === 'history' && (
          <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4">
            <h2 className="font-heading text-lg font-extrabold text-[#192837] pb-3 border-b border-[#192837]/8">
              Threat Audit History ({threats.length})
            </h2>

            <div className="divide-y divide-[#192837]/6">
              {threats.length > 0 ? threats.map(t => (
                <div key={t.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#192837]">{t.threat_type}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 uppercase">
                        {t.severity}
                      </span>
                    </div>
                    <p className="text-xs text-[#192837]/75 font-medium">{t.summary}</p>
                    <span className="text-[10px] text-[#192837]/40 block font-medium">
                      Recorded: {new Date(t.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-sm font-extrabold text-[#7342E2]">{t.risk_score}/100</span>
                    <button
                      type="button"
                      onClick={() => setSelectedThreatId(t.id)}
                      className="px-3 py-1 rounded-xl bg-[#FAF9F6] border border-[#192837]/10 text-xs font-bold text-[#7342E2] hover:bg-[#7342E2] hover:text-white transition-all cursor-pointer"
                    >
                      View Report
                    </button>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-xs text-[#192837]/50">
                  No threat audit history records found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: GMAIL SCANNER & INBOX INGESTION (DEDICATED FULL PAGE) */}
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

        {/* TAB 6: USER PROFILE & ACCOUNT SETTINGS (DEDICATED FULL PAGE) */}
        {activeTab === 'profile' && (
          <UserProfileView
            gmailStatus={gmailStatus}
            monitoringStatus={monitoringStatus}
            onRefreshGmailStatus={loadAllData}
          />
        )}
      </main>

      {/* Manual Threat Scanner Modal */}
      <ManualScanModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onScanCompleted={() => {
          loadAllData()
        }}
      />

      {/* Forensic Deep Dive Modal */}
      <ForensicsModal
        threatId={selectedThreatId}
        onClose={() => setSelectedThreatId(null)}
        onStatusUpdated={loadAllData}
      />

      {/* Syncing / Inbox Scan Loading Modal Popup */}
      {syncingGmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl border border-[#192837]/10 flex flex-col items-center text-center">
            <CoreSpinLoader customStates={[
              'Connecting Inbox...',
              'Fetching Emails...',
              'Extracting Headers...',
              'Checking IP Rep...',
              'Evaluating AI...',
              'Generating Analytics...'
            ]} />
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default UserDashboard
