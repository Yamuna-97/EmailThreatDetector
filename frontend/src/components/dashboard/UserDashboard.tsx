import React, { useState, useEffect, useRef } from 'react'
import {
  ShieldAlert, ShieldCheck, Mail, Sparkles, RefreshCw, AlertTriangle,
  Eye, Clock, Activity, LogOut, ChevronRight, Inbox, Search, CheckCircle, XCircle, Menu, X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { gmailService, type GmailStatus } from '../../services/gmail'
import { threatService, type ThreatItem, type EmailItem, type AlertItem } from '../../services/threats'
import ManualScanModal from './ManualScanModal'
import ForensicsModal from './ForensicsModal'
import { CoreSpinLoader } from '../ui/core-spin-loader'

interface NavTabItem {
  id: 'dashboard' | 'emails' | 'alerts' | 'history'
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  count?: number
}

export const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'emails' | 'alerts' | 'history'>('dashboard')
  const [threats, setThreats] = useState<ThreatItem[]>([])
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [scanModalOpen, setScanModalOpen] = useState<boolean>(false)
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null)
  const [syncingGmail, setSyncingGmail] = useState<boolean>(false)
  const [scanLimit, setScanLimit] = useState<number>(5)
  const [scanFolder, setScanFolder] = useState<'all' | 'inbox' | 'spam'>('all')
  const [emailSearch, setEmailSearch] = useState<string>('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

  // OAuth return banner state
  const [oauthBanner, setOauthBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const oauthHandled = useRef(false)

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [tRes, eRes, aRes, gRes] = await Promise.all([
        threatService.getThreats(),
        threatService.getEmails(),
        threatService.getAlerts(),
        gmailService.getStatus().catch(() => ({ is_connected: false, auto_scan_enabled: false, scan_limit: 10 })),
      ])
      setThreats(tRes)
      setEmails(eRes)
      setAlerts(aRes)
      setGmailStatus(gRes)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
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

        setOauthBanner({ type: 'success', message: 'Gmail connected successfully! Scanning your inbox now…' })

        loadAllData().then(() => {
          setSyncingGmail(true)
          gmailService.scanInbox(10, 'all')
            .then(() => loadAllData())
            .then(() => setActiveTab('emails'))
            .catch(console.error)
            .finally(() => setSyncingGmail(false))
        })

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

  const handleConnectGmail = async () => {
    try {
      const res = await gmailService.connect()
      if (res.auth_url) {
        window.location.href = res.auth_url
      }
    } catch (err) {
      alert('Failed to initialize Google OAuth connect.')
    }
  }

  const handleDisconnectGmail = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail?')) return
    try {
      await gmailService.disconnect()
      await loadAllData()
    } catch (err) {
      alert('Failed to disconnect Gmail.')
    }
  }

  const handleToggleAutoScan = async () => {
    if (!gmailStatus) return
    try {
      const updated = await gmailService.toggleAutoScan(!gmailStatus.auto_scan_enabled)
      setGmailStatus(updated)
    } catch (err) {
      alert('Failed to update auto scan setting.')
    }
  }

  const handleScanGmailWithOptions = async (limit: number, folder: 'all' | 'inbox' | 'spam' = scanFolder) => {
    setSyncingGmail(true)
    try {
      await gmailService.scanInbox(limit, folder)
      await loadAllData()
      setActiveTab('emails')
    } catch (err) {
      alert('Scan failed.')
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
    { id: 'emails', label: 'My Emails', icon: Mail, count: emails.length },
    { id: 'alerts', label: 'Threat Alerts', icon: AlertTriangle, count: unreadAlertsCount },
    { id: 'history', label: 'History', icon: Clock },
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#192837] flex flex-col font-body selection:bg-[#7342E2]/20 selection:text-[#7342E2]">
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

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#192837]/10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7342E2] flex items-center justify-center text-white shadow-md shadow-[#7342E2]/25">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-extrabold text-[#192837] tracking-tight">
                  VaultShield
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7342E2]/10 text-[#7342E2] uppercase tracking-wider whitespace-nowrap">
                  User Portal
                </span>
              </div>
              <span className="text-[11px] text-[#192837]/50 block font-medium">
                AI Email Threat Intelligence
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#FAF9F6] p-1.5 rounded-2xl border border-[#192837]/8">
            {navTabs.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white text-[#7342E2] shadow-xs font-bold'
                      : 'text-[#192837]/70 hover:text-[#192837] hover:bg-white/50'
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      tab.id === 'alerts' ? 'bg-red-500 text-white' : 'bg-[#7342E2]/15 text-[#7342E2]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Actions & Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setScanModalOpen(true)}
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8B5CF6] to-[#7342E2] hover:brightness-110 active:scale-95 shadow-md shadow-[#7342E2]/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Sparkles size={14} />
              <span>Manual Scan</span>
            </button>

            <div className="hidden sm:block h-6 w-[1px] bg-[#192837]/10" />

            <div className="hidden sm:flex items-center gap-2.5 bg-[#FAF9F6] border border-[#192837]/8 px-3 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-[#7342E2] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="text-left text-xs max-w-[140px] truncate">
                <span className="font-bold text-[#192837] block leading-tight truncate">{user?.name}</span>
                <span className="text-[10px] text-[#192837]/50 block truncate">{user?.email}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#192837]/60 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer shrink-0"
            >
              <LogOut size={16} />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#192837]/70 hover:bg-[#FAF9F6] cursor-pointer"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#192837]/10 bg-white p-3 space-y-1 animate-fade-in">
            {navTabs.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    active ? 'bg-[#7342E2]/10 text-[#7342E2] font-bold' : 'text-[#192837]/70 hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#7342E2] text-white text-[10px] font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">

        {/* Compact Strip Header for Inner Tabs (Emails, Alerts, History) */}
        {activeTab !== 'dashboard' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#192837]/10 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-[#192837]">
                {activeTab === 'emails' && `Mailbox Overview (${emails.length} Analyzed Emails)`}
                {activeTab === 'alerts' && `Security Alert Logs (${alerts.length} Total Alerts)`}
                {activeTab === 'history' && `Threat Audit History (${threats.length} Recorded Items)`}
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
            {/* Top Overview & Scanner Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Protection Summary Banner */}
              <div className="lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-white border border-[#192837]/10 shadow-xs flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#7342E2]/10 text-[#7342E2]">
                      Real-Time SOC Defense Active
                    </span>
                    <button
                      type="button"
                      onClick={loadAllData}
                      disabled={loading}
                      title="Refresh threat intelligence"
                      className="p-2 rounded-xl bg-[#FAF9F6] border border-[#192837]/10 text-[#192837]/70 hover:text-[#7342E2] hover:bg-white transition-all cursor-pointer"
                    >
                      <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#192837] tracking-tight mt-3">
                    Defense Overview
                  </h1>
                  <p className="text-xs sm:text-sm text-[#192837]/70 mt-1 font-medium leading-relaxed">
                    AI-powered NLP analysis, DKIM/SPF domain validation & heuristic threat triage running continuously.
                  </p>
                </div>

                {/* Key Metrics Widgets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#192837]/8">
                  <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#192837]/6">
                    <span className="text-[10px] font-bold text-[#192837]/60 uppercase tracking-wider block">Total Scanned</span>
                    <span className="text-2xl font-extrabold font-heading text-[#192837] mt-0.5 block">{totalScanned}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#192837]/6">
                    <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">Active Threats</span>
                    <span className="text-2xl font-extrabold font-heading text-orange-600 mt-0.5 block">{threatCount}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#192837]/6">
                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Critical</span>
                    <span className="text-2xl font-extrabold font-heading text-red-600 mt-0.5 block">{criticalCount}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#192837]/6">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Clean & Safe</span>
                    <span className="text-2xl font-extrabold font-heading text-emerald-600 mt-0.5 block">{safeCount}</span>
                  </div>
                </div>
              </div>

              {/* Gmail API Integration Panel */}
              <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-xs flex flex-col justify-between space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                      <Mail size={19} />
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-bold text-[#192837]">Gmail Ingestion</h3>
                      <span className="text-[10px] text-[#192837]/50 font-medium block">Google OAuth 2.0 API</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    gmailStatus?.is_connected ? 'bg-emerald-100 text-emerald-800' : 'bg-[#192837]/8 text-[#192837]/60'
                  }`}>
                    {gmailStatus?.is_connected ? '● Connected' : 'Disconnected'}
                  </span>
                </div>

                {gmailStatus?.is_connected ? (
                  <div className="space-y-3.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#192837]/8 text-xs font-semibold text-[#192837] truncate">
                      <span className="text-[10px] text-[#192837]/50 block font-normal">Connected Account:</span>
                      <span className="truncate block mt-0.5">{gmailStatus.email_address || user?.email}</span>
                    </div>

                    {/* Scan Presets Pill Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#192837]/75 block">Scan Range (Recent Emails):</label>
                      <div className="grid grid-cols-6 gap-1">
                        {[1, 3, 5, 10, 25, 50].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setScanLimit(val)}
                            className={`py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              scanLimit === val
                                ? 'bg-[#7342E2] text-white shadow-xs'
                                : 'bg-[#FAF9F6] border border-[#192837]/10 text-[#192837]/70 hover:bg-[#7342E2]/10'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Target Mailbox Folder */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#192837]/75 block">Target Folder:</label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'all', label: 'Inbox+Spam' },
                          { id: 'inbox', label: 'Inbox' },
                          { id: 'spam', label: 'Spam' },
                        ].map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setScanFolder(f.id as any)}
                            className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              scanFolder === f.id
                                ? 'bg-[#192837] text-white'
                                : 'bg-[#FAF9F6] border border-[#192837]/10 text-[#192837]/70 hover:bg-[#192837]/5'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auto-Scan Toggle */}
                    <div className="flex items-center justify-between py-1.5 border-t border-[#192837]/8 pt-2">
                      <span className="font-semibold text-xs text-[#192837]/80">Auto-Scan Incoming</span>
                      <button
                        type="button"
                        onClick={handleToggleAutoScan}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                          gmailStatus.auto_scan_enabled ? 'bg-[#7342E2]' : 'bg-[#192837]/20'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          gmailStatus.auto_scan_enabled ? 'translate-x-4.5' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleScanGmailWithOptions(scanLimit)}
                        disabled={syncingGmail}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7342E2] hover:brightness-110 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw size={13} className={syncingGmail ? 'animate-spin' : ''} />
                        <span>{syncingGmail ? 'Scanning...' : `Scan (${scanLimit})`}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnectGmail}
                        className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-all cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-[#192837]/70 leading-relaxed font-medium">
                      Authorize Google OAuth 2.0 to scan inbox emails directly with Gemini AI security model.
                    </p>
                    <button
                      type="button"
                      onClick={handleConnectGmail}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7342E2] text-white font-bold text-xs shadow-md shadow-[#7342E2]/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Mail size={16} />
                      <span>Connect Gmail Account</span>
                    </button>
                  </div>
                )}
              </div>
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
                          onClick={() => handleScanGmailWithOptions(scanLimit)}
                          className="text-xs font-bold text-[#7342E2] hover:underline cursor-pointer"
                        >
                          Scan Gmail inbox now →
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
                    Filter and inspect scanned emails analyzed by VaultShield threat engine
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
                  <button
                    type="button"
                    onClick={() => setSelectedEmail(null)}
                    className="text-xs font-bold text-[#192837]/50 hover:text-[#192837] cursor-pointer"
                  >
                    Close Preview ✕
                  </button>
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

        {/* TAB 3: THREAT ALERTS VIEW */}
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
  )
}

export default UserDashboard
