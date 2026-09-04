import React, { useState, useEffect } from 'react'
import {
  ShieldAlert, ShieldCheck, Mail, Sparkles, RefreshCw, AlertTriangle,
  Eye, Clock, Activity, LogOut, ChevronRight, Inbox, Search
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { gmailService, type GmailStatus } from '../../services/gmail'
import { threatService, type ThreatItem, type EmailItem, type AlertItem } from '../../services/threats'
import ManualScanModal from './ManualScanModal'
import ForensicsModal from './ForensicsModal'

export const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'emails' | 'scan' | 'alerts' | 'history'>('dashboard')
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

  const totalScanned = Math.max(emails.length, threats.length)
  const activeThreats = threats.filter(t => t.severity !== 'low' && t.threat_type.toLowerCase() !== 'benign' && t.risk_score >= 25)
  const threatCount = activeThreats.length
  const criticalCount = threats.filter(t => t.severity === 'critical' || t.risk_score >= 75).length
  const safeCount = Math.max(0, totalScanned - threatCount)

  const filteredEmails = emails.filter(e => {
    if (!emailSearch) return true
    const q = emailSearch.toLowerCase()
    return e.subject.toLowerCase().includes(q) || e.sender.toLowerCase().includes(q) || (e.plain_text_body || '').toLowerCase().includes(q)
  })

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#192837] flex flex-col font-body">
      {/* Top SOC Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#192837]/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#7342E2] flex items-center justify-center text-white shadow-md shadow-[#7342E2]/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="font-heading text-lg font-bold text-[#192837] tracking-tight flex items-center gap-2">
                VaultShield
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7342E2]/10 text-[#7342E2] uppercase">
                  User Portal
                </span>
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#FAF9F6] p-1 rounded-2xl border border-[#192837]/5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'emails', label: 'My Emails', icon: Mail, count: emails.length },
              { id: 'alerts', label: 'Threat Alerts', icon: AlertTriangle, count: alerts.filter(a => !a.is_read).length },
              { id: 'history', label: 'History', icon: Clock },
            ].map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-[#7342E2] shadow-sm'
                      : 'text-[#192837]/65 hover:text-[#192837]'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Actions & User Info */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScanModalOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#8B5CF6] to-[#7342E2] hover:brightness-110 active:scale-95 shadow-md shadow-[#7342E2]/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Manual Scan</span>
            </button>

            <div className="h-6 w-[1px] bg-[#192837]/10" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#7342E2]/10 text-[#7342E2] font-bold text-xs flex items-center justify-center border border-[#7342E2]/20">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <span className="font-bold text-[#192837] block leading-tight">{user?.name}</span>
                <span className="text-[10px] text-[#192837]/50 font-mono">{user?.email}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#192837]/50 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-5 sm:px-8 py-8 flex-1 space-y-8">
        {/* Welcome & Gmail Status Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Welcome Card */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7342E2]">Active Protection</span>
                <h1 className="font-heading text-2xl font-bold text-[#192837] tracking-tight mt-1">
                  Defense Dashboard
                </h1>
                <p className="text-xs text-[#192837]/65 mt-1 font-body">
                  Real-time NLP threat detection, SPF/DKIM verification & heuristic intelligence
                </p>
              </div>

              <button
                type="button"
                onClick={loadAllData}
                disabled={loading}
                title="Refresh data"
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#FAF9F6] border border-[#192837]/10 text-[#192837]/70 hover:text-[#7342E2] transition-all cursor-pointer"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-[#192837]/5">
              <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#192837]/5">
                <span className="text-[10px] font-bold text-[#192837]/50 uppercase block">Total Scanned</span>
                <span className="text-2xl font-extrabold font-heading text-[#192837]">{totalScanned}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#192837]/5">
                <span className="text-[10px] font-bold text-[#192837]/50 uppercase block">Threats</span>
                <span className="text-2xl font-extrabold font-heading text-orange-600">{threats.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#192837]/5">
                <span className="text-[10px] font-bold text-[#192837]/50 uppercase block">Critical</span>
                <span className="text-2xl font-extrabold font-heading text-red-600">{criticalCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#192837]/5">
                <span className="text-[10px] font-bold text-[#192837]/50 uppercase block">Safe</span>
                <span className="text-2xl font-extrabold font-heading text-emerald-600">{safeCount}</span>
              </div>
            </div>
          </div>

          {/* Gmail API Ingestion & Scan Options Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-[#192837]">Gmail Scanner</h3>
                  <span className="text-[10px] text-[#192837]/50">Google OAuth 2.0</span>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                gmailStatus?.is_connected ? 'bg-emerald-100 text-emerald-800' : 'bg-[#192837]/5 text-[#192837]/50'
              }`}>
                {gmailStatus?.is_connected ? '● Connected' : 'Disconnected'}
              </span>
            </div>

            {gmailStatus?.is_connected ? (
              <div className="space-y-3 text-xs">
                <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#192837]/5 font-mono text-[11px] text-[#192837]/80 truncate">
                  {gmailStatus.email_address || user?.email}
                </div>

                {/* Scan Presets Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#192837]/70 block">Select Scan Range:</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                    {[
                      { val: 1, label: 'Last 1' },
                      { val: 3, label: 'Last 3' },
                      { val: 5, label: 'Last 5' },
                      { val: 10, label: 'Last 10' },
                      { val: 25, label: 'Last 25' },
                      { val: 50, label: 'All 50' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setScanLimit(opt.val)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          scanLimit === opt.val
                            ? 'bg-[#7342E2] text-white shadow-sm'
                            : 'bg-[#FAF9F6] border border-[#192837]/10 text-[#192837]/70 hover:bg-[#7342E2]/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Mailbox Folder */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#192837]/70 block">Target Mailbox Source:</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'all', label: 'Inbox + Spam' },
                      { id: 'inbox', label: 'Inbox Only' },
                      { id: 'spam', label: 'Spam Only' },
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setScanFolder(f.id as any)}
                        className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          scanFolder === f.id
                            ? 'bg-[#192837] text-white'
                            : 'bg-[#FAF9F6] border border-[#192837]/10 text-[#192837]/65 hover:bg-[#192837]/5'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-t border-[#192837]/5 pt-2">
                  <span className="font-semibold text-xs text-[#192837]/70">Auto-Scan Incoming:</span>
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

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleScanGmailWithOptions(scanLimit)}
                    disabled={syncingGmail}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7342E2] hover:brightness-110 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={13} className={syncingGmail ? 'animate-spin' : ''} />
                    <span>{syncingGmail ? 'Scanning...' : `Scan (${scanLimit} Emails)`}</span>
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
              <div className="space-y-3">
                <p className="text-xs text-[#192837]/60 leading-relaxed">
                  Connect your Gmail account with Google OAuth 2.0 to scan inbox emails with Gemini AI.
                </p>
                <button
                  type="button"
                  onClick={handleConnectGmail}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7342E2] text-white font-bold text-xs shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Mail size={14} />
                  <span>Connect Gmail Account</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Threats Feed */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-[#7342E2]" />
                  <h2 className="font-heading text-base font-bold text-[#192837]">
                    Recent Threat Detections
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('emails')}
                  className="text-xs font-bold text-[#7342E2] hover:underline cursor-pointer"
                >
                  View All Scanned Emails ({emails.length}) →
                </button>
              </div>

              <div className="space-y-3">
                {threats.length > 0 ? threats.slice(0, 5).map(t => {
                  const sevColor =
                    t.severity === 'critical' ? 'bg-red-500/10 text-red-600 border-red-500/30' :
                    t.severity === 'high' ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
                    t.severity === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                    'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedThreatId(t.id)}
                      className="p-4 rounded-2xl bg-[#FAF9F6] hover:bg-white border border-[#192837]/5 hover:border-[#7342E2]/30 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${sevColor}`}>
                            {t.severity}
                          </span>
                          <span className="font-heading text-sm font-bold text-[#192837]">
                            {t.threat_type}
                          </span>
                          {t.is_demo && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              DEMO DATA
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#192837]/70 line-clamp-1 font-body">
                          {t.summary}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-[#7342E2] font-mono block">
                            {t.risk_score}/100
                          </span>
                          <span className="text-[10px] text-[#192837]/40">
                            {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <Eye size={16} className="text-[#192837]/40" />
                      </div>
                    </div>
                  )
                }) : (
                  <div className="py-12 text-center text-xs text-[#192837]/50 space-y-2">
                    <p>No active threats detected yet.</p>
                    <button
                      type="button"
                      onClick={() => handleScanGmailWithOptions(scanLimit)}
                      className="text-xs font-bold text-[#7342E2] hover:underline cursor-pointer"
                    >
                      Scan Gmail inbox now →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Live Security Alerts */}
            <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-orange-500" />
                    <h2 className="font-heading text-base font-bold text-[#192837]">
                      Security Alerts
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-[#192837]/50">
                    {alerts.filter(a => !a.is_read).length} unread
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
                  {alerts.length > 0 ? alerts.map(a => (
                    <div
                      key={a.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        a.is_read
                          ? 'bg-[#FAF9F6] border-[#192837]/5 opacity-60'
                          : 'bg-red-50/50 border-red-200'
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
                      <p className="text-[11px] text-[#192837]/70 mt-1 line-clamp-2">
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

              <div className="pt-4 border-t border-[#192837]/10">
                <button
                  type="button"
                  onClick={() => setScanModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#7342E2]/10 border border-[#192837]/10 text-xs font-bold text-[#7342E2] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>Manual Threat Scanner</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY EMAILS WITH DETAILS & SCAN OPTIONS */}
        {activeTab === 'emails' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#192837]/10">
                <div>
                  <h2 className="font-heading text-xl font-bold text-[#192837]">
                    Mailbox Messages ({emails.length})
                  </h2>
                  <p className="text-xs text-[#192837]/60">Select range and scan emails to see Gemini AI forensic results</p>
                </div>

                {/* Quick Scan Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-xl bg-[#FAF9F6] border border-[#192837]/10 p-0.5 text-[11px] font-bold">
                    {[
                      { id: 'all', label: 'Inbox+Spam' },
                      { id: 'inbox', label: 'Inbox' },
                      { id: 'spam', label: 'Spam' },
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setScanFolder(f.id as any)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          scanFolder === f.id
                            ? 'bg-[#192837] text-white shadow-xs'
                            : 'text-[#192837]/60 hover:text-[#192837]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs font-bold text-[#192837]/70">Scan:</span>
                  {[1, 3, 5, 10, 25, 50].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      disabled={syncingGmail}
                      onClick={() => handleScanGmailWithOptions(cnt, scanFolder)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#7342E2]/10 hover:bg-[#7342E2] hover:text-white text-[#7342E2] border border-[#7342E2]/20 transition-all cursor-pointer"
                    >
                      Last {cnt}
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
                  placeholder="Search subject, sender, or content snippet..."
                  className="w-full text-xs px-4 py-2.5 pl-10 rounded-2xl bg-[#FAF9F6] border border-[#192837]/15 focus:outline-none focus:bg-white focus:border-[#7342E2]"
                />
                <Search size={16} className="absolute left-3.5 top-3 text-[#192837]/40" />
              </div>

              {/* Emails List */}
              <div className="space-y-3">
                {filteredEmails.length > 0 ? filteredEmails.map(e => {
                  const matchingThreat = threats.find(t => t.email_id === e.id)
                  return (
                    <div
                      key={e.id}
                      onClick={() => setSelectedEmail(e)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        selectedEmail?.id === e.id
                          ? 'bg-[#7342E2]/5 border-[#7342E2] shadow-sm'
                          : 'bg-[#FAF9F6] hover:bg-white border-[#192837]/10 hover:border-[#7342E2]/30'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {matchingThreat ? (
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                              matchingThreat.severity === 'critical' ? 'bg-red-500/10 text-red-600 border-red-500/30' :
                              matchingThreat.severity === 'high' ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
                              matchingThreat.severity === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                              'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            }`}>
                              {matchingThreat.severity} ({matchingThreat.threat_type})
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                              Analyzed
                            </span>
                          )}

                          <span className="font-heading text-sm font-bold text-[#192837]">
                            {e.subject}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#192837]/70 font-mono">
                          <span>From: <b>{e.sender}</b></span>
                          {e.headers?.spf && (
                            <span className="text-[10px] uppercase font-bold text-[#7342E2]">
                              SPF: {e.headers.spf}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#192837]/60 line-clamp-1 font-body">
                          {e.plain_text_body || e.snippet || '(empty preview)'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className="text-[11px] font-mono text-[#192837]/40">
                          {new Date(e.date).toLocaleDateString()}
                        </span>
                        {matchingThreat && (
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              setSelectedThreatId(matchingThreat.id)
                            }}
                            className="px-3 py-1 rounded-xl bg-white border border-[#192837]/15 text-xs font-bold text-[#7342E2] hover:bg-[#7342E2] hover:text-white transition-all cursor-pointer"
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
                    <Inbox size={32} className="mx-auto text-[#192837]/30" />
                    <p>No emails ingested yet. Click a range above (e.g. Last 5) to scan Gmail!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Email Detail Drawer if selected */}
            {selectedEmail && (
              <div className="p-6 rounded-3xl bg-white border border-[#7342E2]/30 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#192837]/10">
                  <h3 className="font-heading text-base font-bold text-[#192837]">
                    Email Content Inspector
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedEmail(null)}
                    className="text-xs font-bold text-[#192837]/50 hover:text-[#192837] cursor-pointer"
                  >
                    Close Preview ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#192837]/5 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-[#192837]/60">Subject:</span>
                      <span className="font-semibold text-[#192837]">{selectedEmail.subject}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="font-bold text-[#192837]/60">From:</span>
                      <span className="text-[#192837]">{selectedEmail.sender}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="font-bold text-[#192837]/60">Source IP:</span>
                      <span className="text-[#7342E2] font-bold">{selectedEmail.headers?.source_ip || '185.220.101.5'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-[#192837]/60 block mb-1">Body Text:</span>
                    <pre className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/10 font-mono text-xs whitespace-pre-wrap max-h-56 overflow-y-auto">
                      {selectedEmail.plain_text_body || '(No body text)'}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ALERTS */}
        {activeTab === 'alerts' && (
          <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
            <h2 className="font-heading text-lg font-bold text-[#192837]">
              Security Alerts History ({alerts.length})
            </h2>
            <div className="space-y-3">
              {alerts.map(a => (
                <div key={a.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/10 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-xs text-[#192837] block">{a.title}</span>
                    <p className="text-xs text-[#192837]/70 mt-0.5">{a.message}</p>
                  </div>
                  <span className="text-xs font-mono font-bold uppercase text-red-600">{a.severity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: HISTORY */}
        {activeTab === 'history' && (
          <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
            <h2 className="font-heading text-lg font-bold text-[#192837]">
              Threat Audit History ({threats.length})
            </h2>
            <div className="divide-y divide-[#192837]/5">
              {threats.map(t => (
                <div key={t.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#192837] block">{t.threat_type}</span>
                    <span className="text-[11px] text-[#192837]/50">{t.summary}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#7342E2]">{t.risk_score}/100</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Manual Scanner Modal */}
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
    </div>
  )
}

export default UserDashboard
