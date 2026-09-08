import React, { useState, useEffect, useMemo } from 'react'
import {
  ShieldAlert, Globe, Users, BarChart3, FileText,
  Download, Eye, RefreshCw,
  Search, Terminal, LogOut,
  AlertTriangle, CheckCircle, Activity, MapPin, ArrowLeft, UserCheck,
  Cpu, Shield, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { threatService, type ThreatItem } from '../../services/threats'
import { gmailService, type GmailStatus } from '../../services/gmail'
import ForensicsModal from './ForensicsModal'
import ThreatMapView from './ThreatMapView'
import { InvestigatorRAGCopilot } from './InvestigatorRAGCopilot'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
import { CyberTraceLogoIcon } from '../CyberTraceLogo'
import NotificationsWithActions from '../ui/notifications-with-actions'
import { useNotifications } from '../../context/NotificationContext'
import { ThreatsDataTable } from './ThreatsDataTable'

/* ── Severity helpers ───────────────────────────────────── */
const sevClass = (s: string) => {
  if (s === 'critical') return 'critical'
  if (s === 'high') return 'high'
  if (s === 'medium') return 'medium'
  return 'low'
}

const sevColors = {
  critical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', barColor: '#F43F5E' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', barColor: '#F97316' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400', barColor: '#F59E0B' },
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', barColor: '#22C55E' },
}

export const InvestigatorDashboard: React.FC = () => {
  const { logout } = useAuth()
  const { notifications, removeNotification, archiveNotification } = useNotifications()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'threats' | 'map' | 'users' | 'copilot' | 'analytics' | 'reports'>('dashboard')
  const [copilotSelectedEmailId, setCopilotSelectedEmailId] = useState<string>('')
  const [stats, setStats] = useState<any>(null)
  const [threats, setThreats] = useState<ThreatItem[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [allEmails, setAllEmails] = useState<any[]>([])
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [userSearchQuery, setUserSearchQuery] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)

  const loadInvestigatorData = async () => {
    setLoading(true)
    try {
      const [dashStats, threatList, users, anData, emails, gRes] = await Promise.all([
        threatService.getInvestigatorDashboard().catch(() => ({})),
        threatService.getInvestigatorThreats().catch(() => []),
        threatService.getUsers().catch(() => []),
        threatService.getAnalytics().catch(() => ({})),
        threatService.getEmails().catch(() => []),
        gmailService.getStatus().catch(() => ({ is_connected: false })),
      ])
      setStats(dashStats)
      setThreats(threatList)
      setUsersList(users)
      setAnalytics(anData)
      setAllEmails(emails)
      setGmailStatus(gRes as GmailStatus)
    } catch (err) {
      console.error('Error loading investigator data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvestigatorData()
  }, [])

  const handleDownloadPdfReport = async (tId: string) => {
    try {
      const blob = await threatService.downloadReportPdf(tId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CyberTrace_Forensic_Report_${tId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert('Failed to download PDF report.')
    }
  }

  const mostDangerousThreat = useMemo(() => {
    if (!threats || threats.length === 0) return null
    return [...threats].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))[0]
  }, [threats])

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return usersList
    const q = userSearchQuery.toLowerCase()
    return usersList.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    )
  }, [usersList, userSearchQuery])

  const selectedUserThreats = useMemo(() => {
    if (!selectedUser) return []
    return threats.filter(t => t.user_id === selectedUser.id)
  }, [selectedUser, threats])

  const selectedUserEmails = useMemo(() => {
    if (!selectedUser) return []
    return allEmails.filter(e => e.user_id === selectedUser.id || e.recipient === selectedUser.email)
  }, [selectedUser, allEmails])

  const investigatorTabs = [
    { id: 'dashboard', label: 'Overview', icon: BarChart3 },
    { id: 'threats', label: 'Threat Monitoring', icon: ShieldAlert, count: threats.length },
    { id: 'copilot', label: 'SOC RAG Copilot', icon: Cpu },
    { id: 'map', label: 'Threat Map', icon: Globe },
    { id: 'users', label: 'User Monitoring', icon: Users, count: usersList.length },
    { id: 'analytics', label: 'Analytics', icon: Terminal },
    { id: 'reports', label: 'Reports', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-[#F2F3F8] text-[#192837] flex flex-col md:flex-row font-body">

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
                  <span className="font-heading text-sm font-extrabold text-[#192837] tracking-tight block leading-tight">
                    Cyber<span className="text-[#7342E2]">Trace</span>
                  </span>
                  <span className="text-[9px] text-[#7342E2] font-bold block uppercase tracking-widest mt-0.5">
                    SOC Console
                  </span>
                </div>
              )}
            </div>

            {sidebarOpen && (
              <span className="section-label px-3 mb-1">Investigator Menu</span>
            )}

            {/* Nav Links */}
            <div className="flex flex-col gap-0.5">
              {investigatorTabs.map((tab) => {
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
          </div>

          {/* Bottom actions */}
          <div className="border-t border-[rgba(115,66,226,0.1)] pt-3 flex flex-col gap-0.5">
            <SidebarLink
              link={{
                label: 'Refresh Data',
                icon: <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />,
                onClick: loadInvestigatorData,
              }}
            />
            <SidebarLink
              link={{
                label: 'Sign Out',
                icon: <LogOut size={17} className="text-rose-500" />,
                onClick: logout,
              }}
              className="hover:bg-rose-50 hover:text-rose-700"
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">

        {/* Top Header */}
        <header className="dash-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="hidden sm:flex w-7 h-7 rounded-lg bg-[#F5F3FF] border border-[#E0D9FF] items-center justify-center shrink-0">
                {(() => {
                  const tab = investigatorTabs.find(t => t.id === activeTab)
                  const Icon = tab?.icon || BarChart3
                  return <Icon size={14} className="text-[#7342E2]" />
                })()}
              </div>
              <span className="font-heading text-sm font-bold text-[#192837] truncate">
                {investigatorTabs.find(t => t.id === activeTab)?.label || 'SOC Console'}
              </span>
              <span className="hidden sm:inline text-[10px] text-[#7342E2] font-extrabold uppercase px-2 py-0.5 rounded-lg bg-[#F5F3FF] border border-[#E0D9FF]">
                Investigation Dossier
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Gmail Status */}
              {gmailStatus?.is_connected ? (
                <div title={`Gmail: ${gmailStatus?.email_address}`} className="status-pill connected hidden sm:flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate max-w-[140px]">{gmailStatus?.email_address || 'Connected'}</span>
                </div>
              ) : (
                <div title="Gmail is disconnected." className="status-pill disconnected">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="hidden sm:block">Gmail: Disconnected</span>
                </div>
              )}

              {/* Notifications */}
              <NotificationsWithActions
                items={notifications}
                onDelete={removeNotification}
                onArchive={archiveNotification}
                placement="bottom"
              />

              {/* Refresh */}
              <button
                type="button"
                onClick={loadInvestigatorData}
                disabled={loading}
                title="Refresh Telemetry"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#192837]/50 hover:text-[#7342E2] hover:bg-[#F5F3FF] border border-[rgba(115,66,226,0.12)] transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>

              <div className="h-4 w-px bg-[rgba(115,66,226,0.15)]" />

              {/* Sign Out */}
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#192837]/50 hover:text-rose-600 hover:bg-rose-50 border border-[rgba(115,66,226,0.12)] hover:border-rose-200 transition-all cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* ── Main Body ── */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">

          {/* ══ TAB: OVERVIEW DASHBOARD ══ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">

              {/* Critical Threat Alert Banner */}
              {mostDangerousThreat && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-700 via-rose-800 to-[#192837] text-white p-6 shadow-lg border border-rose-500/40">
                  {/* Radar pulse decoration */}
                  <div className="absolute right-6 top-6 w-24 h-24 pointer-events-none">
                    <div className="absolute inset-0 rounded-full border-2 border-rose-400/30 animate-radar" />
                    <div className="absolute inset-2 rounded-full border border-rose-400/20 animate-radar" style={{ animationDelay: '0.5s' }} />
                    <AlertTriangle size={32} className="absolute inset-0 m-auto text-rose-300/40" />
                  </div>

                  <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-[10px] font-extrabold uppercase tracking-wider border border-white/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-300 animate-ping" />
                        Highest Critical Threat — All Monitored Accounts
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-black/30 text-rose-200 font-mono text-xs font-bold border border-rose-400/30">
                        #{mostDangerousThreat.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                      {mostDangerousThreat.threat_type} — Risk Score {mostDangerousThreat.risk_score}/100
                    </h2>

                    <p className="text-sm text-rose-100/85 leading-relaxed line-clamp-2">
                      {mostDangerousThreat.summary || 'High-risk threat detected requiring urgent investigator triage and account lockdown.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-rose-200">
                      <span>Severity: <strong className="text-white uppercase">{mostDangerousThreat.severity}</strong></span>
                      <span>·</span>
                      <span>Status: <strong className="text-white uppercase">{mostDangerousThreat.status}</strong></span>
                      <span>·</span>
                      <span>Confidence: <strong className="text-white">{Math.round((mostDangerousThreat.confidence || 0.96) * 100)}%</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
                    <button
                      type="button"
                      onClick={() => setSelectedThreatId(mostDangerousThreat.id)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white text-rose-700 font-extrabold text-xs hover:bg-rose-50 transition-all shadow-md cursor-pointer"
                    >
                      <Eye size={14} />
                      Deep Forensics Investigation
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdfReport(mostDangerousThreat.id)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-900/80 text-white font-bold text-xs border border-white/15 hover:bg-rose-900 transition-all shadow-md cursor-pointer"
                    >
                      <Download size={14} />
                      Download Incident PDF Dossier
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="metric-card metric-total">
                  <span className="section-label block mb-2">Emails Scanned</span>
                  <span className="font-heading text-3xl font-extrabold text-[#192837]">
                    {stats?.total_emails_scanned ?? (allEmails.length || threats.length)}
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold mt-1 block">Pipeline Active</span>
                </div>

                <div className="metric-card metric-threat">
                  <span className="section-label block mb-2" style={{ color: '#C2410C' }}>Total Threats</span>
                  <span className="font-heading text-3xl font-extrabold text-orange-600">
                    {stats?.total_threats ?? threats.length}
                  </span>
                  <span className="text-xs text-orange-500/70 font-semibold mt-1 block">via Gemini AI</span>
                </div>

                <div className="metric-card metric-critical">
                  <span className="section-label block mb-2" style={{ color: '#BE123C' }}>Critical Threats</span>
                  <span className="font-heading text-3xl font-extrabold text-rose-600">
                    {stats?.critical_threats ?? threats.filter(t => t.severity === 'critical').length}
                  </span>
                  <span className="text-xs text-rose-400/70 font-semibold mt-1 block">Immediate Alert</span>
                </div>

                <div className="metric-card metric-users">
                  <span className="section-label block mb-2" style={{ color: '#4338CA' }}>Monitored Users</span>
                  <span className="font-heading text-3xl font-extrabold text-indigo-600">
                    {usersList.length || 1}
                  </span>
                  <span className="text-xs text-indigo-400/70 font-semibold mt-1 block">Enterprise RBAC</span>
                </div>

                <div className="metric-card metric-suspicious col-span-2 sm:col-span-1">
                  <span className="section-label block mb-2" style={{ color: '#B45309' }}>Suspicious IPs</span>
                  <span className="font-heading text-3xl font-extrabold text-amber-600">
                    {stats?.suspicious_ip_count ?? 4}
                  </span>
                  <span className="text-xs text-amber-500/70 font-semibold mt-1 block">IPQS Validated</span>
                </div>
              </div>

              {/* Severity Breakdown Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Critical (75-100)', count: stats?.critical_threats ?? threats.filter(t => t.severity === 'critical').length, icon: AlertTriangle, color: 'critical' },
                  { label: 'High (50-74)', count: stats?.high_threats ?? threats.filter(t => t.severity === 'high').length, icon: ShieldAlert, color: 'high' },
                  { label: 'Medium (25-49)', count: stats?.medium_threats ?? threats.filter(t => t.severity === 'medium').length, icon: Activity, color: 'medium' },
                  { label: 'Low (0-24)', count: stats?.low_threats ?? threats.filter(t => t.severity === 'low').length, icon: CheckCircle, color: 'low' },
                ].map(({ label, count, icon: Icon, color }) => {
                  const sev = sevColors[color as keyof typeof sevColors]
                  return (
                    <div key={label} className={`p-4 rounded-2xl ${sev.bg} border ${sev.border} flex items-center justify-between`}>
                      <div>
                        <span className={`section-label block mb-1 ${sev.text}`}>{label}</span>
                        <span className={`font-heading text-2xl font-extrabold ${sev.text}`}>{count}</span>
                      </div>
                      <Icon size={20} className={`${sev.text} opacity-60`} />
                    </div>
                  )
                })}
              </div>

              {/* Analytics + User Leaderboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Threat Type Distribution */}
                <div className="dash-card p-6 space-y-5">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-[#192837]">Threat Vector Analytics</h3>
                    <p className="text-xs text-[#192837]/45 mt-0.5">Distribution across mail streams</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: 'Phishing Attacks', count: stats?.phishing_count || threats.filter(t => t.threat_type.toLowerCase().includes('phish')).length, color: '#F43F5E' },
                      { label: 'Business Email Compromise', count: stats?.bec_count || threats.filter(t => t.threat_type.toLowerCase().includes('bec') || t.threat_type.toLowerCase().includes('compromise')).length, color: '#F97316' },
                      { label: 'Credential Theft / Fraud', count: stats?.fraud_count || threats.filter(t => t.threat_type.toLowerCase().includes('fraud') || t.threat_type.toLowerCase().includes('theft')).length, color: '#7342E2' },
                      { label: 'Malware Vectors', count: stats?.malware_count || threats.filter(t => t.threat_type.toLowerCase().includes('malware')).length, color: '#F59E0B' },
                    ].map((cat, idx) => {
                      const total = Math.max(1, threats.length)
                      const pct = Math.round((cat.count / total) * 100)
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-[#192837] flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                              {cat.label}
                            </span>
                            <span className="font-mono" style={{ color: cat.color }}>{cat.count} ({pct}%)</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: `${Math.max(4, pct)}%`, background: cat.color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('map')}
                    className="w-full py-2.5 rounded-xl bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-[#E0D9FF] text-xs font-bold text-[#7342E2] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Globe size={13} />
                    View Geographic Threat Map
                  </button>
                </div>

                {/* User Leaderboard */}
                <div className="lg:col-span-2 dash-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-sm font-bold text-[#192837]">Monitored Accounts Leaderboard</h3>
                      <p className="text-xs text-[#192837]/45 mt-0.5">Click to inspect detailed telemetry</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('users')}
                      className="flex items-center gap-1 text-xs font-bold text-[#7342E2] hover:underline cursor-pointer"
                    >
                      All accounts ({usersList.length}) <ChevronRight size={13} />
                    </button>
                  </div>

                  <div className="divide-y divide-[rgba(115,66,226,0.06)]">
                    {usersList.slice(0, 5).map((u, i) => (
                      <div key={i} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#FAFAFA] px-2 rounded-2xl transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] border border-[#E0D9FF] text-[#7342E2] font-extrabold text-sm flex items-center justify-center">
                            {u.name ? u.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[#192837]">{u.name || 'Enterprise User'}</span>
                              <span className="px-2 py-0.5 rounded-full bg-[#F8F9FC] text-[#192837]/50 text-[9px] font-bold uppercase border border-[rgba(115,66,226,0.08)]">
                                {u.role}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#192837]/45 font-mono">{u.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-xl">
                            {u.threats_count} threats
                          </span>
                          <button
                            type="button"
                            onClick={() => { setSelectedUser(u); setActiveTab('users') }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#7342E2] hover:bg-[#6032C4] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <UserCheck size={12} />
                            Inspect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Incident Stream */}
              <div className="dash-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-[#192837]">Recent Incident Stream</h3>
                    <p className="text-xs text-[#192837]/45 mt-0.5">Verified threat telemetry across monitored accounts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('threats')}
                    className="flex items-center gap-1 text-xs font-bold text-[#7342E2] hover:underline cursor-pointer"
                  >
                    All threats ({threats.length}) <ChevronRight size={13} />
                  </button>
                </div>

                {threats.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] border border-[#E0D9FF] flex items-center justify-center mx-auto">
                      <Shield size={22} className="text-[#7342E2]" />
                    </div>
                    <p className="text-sm font-bold text-[#192837]">No threats detected</p>
                    <p className="text-xs text-[#192837]/45">Threat data will appear once users connect Gmail</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {threats.slice(0, 5).map(t => {
                      const sc = sevClass(t.severity)
                      return (
                        <div key={t.id} className={`threat-row ${sc} stagger-item`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`sev-badge ${sc}`}>{t.severity}</span>
                                <span className="font-heading text-sm font-bold text-[#192837] truncate">{t.threat_type}</span>
                                <span className="text-[10px] font-mono text-[#192837]/40">#{t.id.slice(0, 8).toUpperCase()}</span>
                                <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                  Risk {t.risk_score}/100
                                </span>
                              </div>
                              <p className="text-xs text-[#192837]/65 line-clamp-1">{t.summary}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-center">
                              <button
                                type="button"
                                onClick={() => setSelectedThreatId(t.id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[rgba(115,66,226,0.12)] text-xs font-bold text-[#192837] hover:border-[#7342E2] hover:text-[#7342E2] transition-all cursor-pointer"
                              >
                                <Eye size={12} />
                                Forensics
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadPdfReport(t.id)}
                                title="Download PDF"
                                className="w-8 h-8 rounded-xl bg-[#F5F3FF] hover:bg-[#7342E2] hover:text-white text-[#7342E2] border border-[#E0D9FF] transition-all flex items-center justify-center cursor-pointer"
                              >
                                <Download size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB: THREAT MONITORING ══ */}
          {activeTab === 'threats' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h1 className="font-heading text-2xl font-extrabold text-[#192837]">Threat Monitoring</h1>
                <p className="text-sm text-[#192837]/55 mt-0.5">Full organizational security incidents with forensic lookup and risk metrics</p>
              </div>
              <div className="dash-card p-6">
                <ThreatsDataTable
                  data={threats}
                  onViewForensics={(threatId) => setSelectedThreatId(threatId)}
                  onDownloadPdf={(threatId) => handleDownloadPdfReport(threatId)}
                  onOpenCopilot={(emailOrThreatId) => {
                    setCopilotSelectedEmailId(emailOrThreatId)
                    setActiveTab('copilot')
                  }}
                />
              </div>
            </div>
          )}

          {/* ══ TAB: THREAT MAP ══ */}
          {activeTab === 'map' && <ThreatMapView />}

          {/* ══ TAB: USER MONITORING ══ */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fade-in">
              {selectedUser ? (
                /* ── Selected User Detail View ── */
                <div className="space-y-6">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[rgba(115,66,226,0.12)] text-xs font-bold text-[#7342E2] hover:bg-[#F5F3FF] transition-all cursor-pointer shadow-xs"
                  >
                    <ArrowLeft size={13} />
                    Back to Monitored Accounts
                  </button>

                  {/* User Header Card */}
                  <div className="dash-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] border-2 border-[#E0D9FF] text-[#7342E2] text-2xl font-extrabold flex items-center justify-center shadow-sm">
                        {selectedUser.name ? selectedUser.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-heading text-xl font-bold text-[#192837]">{selectedUser.name || 'Enterprise User Account'}</h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#F5F3FF] text-[#7342E2] font-bold text-[10px] uppercase border border-[#E0D9FF]">
                            {selectedUser.role}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-[#7342E2] font-bold mt-0.5">{selectedUser.email}</p>
                        <p className="text-[11px] text-[#192837]/40 mt-0.5">
                          Account ID: <code className="font-mono">{selectedUser.id}</code>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      {[
                        { label: 'Threats Logged', value: selectedUserThreats.length || selectedUser.threats_count || 0, color: 'text-orange-600' },
                        { label: 'Critical Threats', value: selectedUserThreats.filter(t => t.severity === 'critical').length || selectedUser.critical_count || 0, color: 'text-rose-600' },
                        { label: 'Scanned Emails', value: selectedUserEmails.length || Math.max(selectedUserThreats.length, 1), color: 'text-[#7342E2]' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="p-3.5 rounded-2xl bg-[#F8F9FC] border border-[rgba(115,66,226,0.1)] text-center min-w-[110px]">
                          <span className="section-label block mb-1">{label}</span>
                          <span className={`text-xl font-extrabold font-mono ${color}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User Threats Table */}
                  <div className="dash-card p-6 space-y-4">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-[#192837]">Emails & Threats Analyzed</h3>
                      <p className="text-xs text-[#192837]/45">for {selectedUser.email}</p>
                    </div>

                    {selectedUserThreats.length === 0 ? (
                      <div className="py-14 text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                          <CheckCircle size={26} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#192837]">No Threat Incidents Logged</p>
                          <p className="text-xs text-[#192837]/45 mt-0.5">This enterprise user account is clean and protected.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedUserThreats.map(t => {
                          const sc = sevClass(t.severity)
                          return (
                            <div key={t.id} className={`threat-row ${sc}`}>
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`sev-badge ${sc}`}>{t.severity}</span>
                                    <span className="font-heading text-sm font-bold text-[#192837]">{t.threat_type}</span>
                                    <span className="text-[10px] font-mono text-[#192837]/40">#{t.id.slice(0, 8).toUpperCase()}</span>
                                    <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                      Risk: {t.risk_score}/100
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#192837]/65 leading-relaxed">
                                    {t.summary || 'Scanned email content flagged for potential cybersecurity risks.'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#192837]/40 font-mono">
                                    <span>Status: <strong className="uppercase text-[#192837]/70">{t.status}</strong></span>
                                    <span>·</span>
                                    <span>{new Date(t.created_at).toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                  <button
                                    type="button"
                                    onClick={() => { setCopilotSelectedEmailId(t.email_id || t.id); setActiveTab('copilot') }}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F5F3FF] hover:bg-[#7342E2] hover:text-white text-[#7342E2] border border-[#E0D9FF] text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Cpu size={12} />
                                    Copilot
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedThreatId(t.id)}
                                    className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[#7342E2] hover:bg-[#6032C4] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                                  >
                                    <Eye size={12} />
                                    Forensics
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadPdfReport(t.id)}
                                    className="w-8 h-8 rounded-xl bg-white hover:bg-[#F5F3FF] text-[#7342E2] border border-[rgba(115,66,226,0.12)] flex items-center justify-center cursor-pointer transition-all"
                                  >
                                    <Download size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ── Users List ── */
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="font-heading text-2xl font-extrabold text-[#192837]">Monitored Enterprise Accounts</h1>
                      <p className="text-sm text-[#192837]/55 mt-0.5">{filteredUsers.length} accounts · RBAC monitored threat telemetry</p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search by name or email…"
                        className="w-full text-xs px-4 py-2.5 pl-9 rounded-xl bg-white border border-[rgba(115,66,226,0.12)] text-[#192837] focus:outline-none focus:border-[#7342E2] transition-colors"
                      />
                      <Search size={13} className="absolute left-3 top-3 text-[#192837]/40" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredUsers.map((u, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedUser(u)}
                        className="dash-card p-5 cursor-pointer group stagger-item"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] border border-[#E0D9FF] text-[#7342E2] font-extrabold text-base flex items-center justify-center group-hover:bg-[#7342E2] group-hover:text-white transition-all">
                              {u.name ? u.name[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <span className="font-bold text-sm text-[#192837] block group-hover:text-[#7342E2] transition-colors">
                                {u.name || 'Enterprise User'}
                              </span>
                              <span className="text-xs text-[#192837]/45 font-mono">{u.email}</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-white border border-[rgba(115,66,226,0.1)] font-bold uppercase text-[10px] text-[#192837]/50">
                            {u.role}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[rgba(115,66,226,0.06)] text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-lg">
                              {u.threats_count} Threats
                            </span>
                            {u.critical_count > 0 && (
                              <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg">
                                {u.critical_count} Critical
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-[#7342E2] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            Inspect <ChevronRight size={13} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: SOC RAG COPILOT ══ */}
          {activeTab === 'copilot' && (
            <div className="animate-fade-in">
              <InvestigatorRAGCopilot
                emails={allEmails.length > 0 ? allEmails : threats}
                users={usersList}
                selectedEmailId={copilotSelectedEmailId}
              />
            </div>
          )}

          {/* ══ TAB: ANALYTICS ══ */}
          {activeTab === 'analytics' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h1 className="font-heading text-2xl font-extrabold text-[#192837]">Threat Analytics</h1>
                <p className="text-sm text-[#192837]/55 mt-0.5">Statistical breakdown of organizational threat vectors</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Threat Vector Distribution */}
                <div className="dash-card p-6 space-y-4">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-[#192837]">Threat Vector Distribution</h3>
                    <p className="text-xs text-[#192837]/45 mt-0.5">Classified by Gemini AI inference pipeline</p>
                  </div>
                  <div className="space-y-3">
                    {(analytics?.threat_distribution || []).map((item: any, i: number) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-[#192837]">{item.name}</span>
                          <span className="text-[#7342E2]">{item.percentage}% ({item.count || 0})</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-bar-fill bg-[#7342E2]" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                    {(!analytics?.threat_distribution || analytics.threat_distribution.length === 0) && (
                      <p className="text-xs text-[#192837]/45 py-6 text-center">No distribution data available yet.</p>
                    )}
                  </div>
                </div>

                {/* Geographic Distribution */}
                <div className="dash-card p-6 space-y-4">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-[#192837]">Origin Geographic Sources</h3>
                    <p className="text-[11px] text-[#192837]/40 mt-0.5">IP-based approximate location — not exact physical address</p>
                  </div>
                  <div className="space-y-2.5">
                    {(analytics?.geographic_distribution || []).map((geo: any, i: number) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-[#F8F9FC] border border-[rgba(115,66,226,0.08)] flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin size={13} className="text-[#7342E2] shrink-0" />
                          <span className="font-bold text-[#192837]">{geo.country} ({geo.code})</span>
                        </div>
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg text-xs">{geo.threats} Detected</span>
                      </div>
                    ))}
                    {(!analytics?.geographic_distribution || analytics.geographic_distribution.length === 0) && (
                      <p className="text-xs text-[#192837]/45 py-6 text-center">Geographic data will appear after scans with IP resolution.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: REPORTS ══ */}
          {activeTab === 'reports' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h1 className="font-heading text-2xl font-extrabold text-[#192837]">Forensic Incident Dossiers</h1>
                <p className="text-sm text-[#192837]/55 mt-0.5">{threats.length} court-admissible PDF forensic dossiers available</p>
              </div>

              <div className="dash-card p-6 space-y-3">
                {threats.length > 0 ? threats.map(t => {
                  const sc = sevClass(t.severity)
                  return (
                    <div key={t.id} className="p-4 rounded-2xl bg-[#F8F9FC] border border-[rgba(115,66,226,0.08)] hover:border-[rgba(115,66,226,0.2)] hover:bg-white flex items-center justify-between gap-4 transition-all stagger-item">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] border border-[#E0D9FF] text-[#7342E2] flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-[#192837] block truncate">
                            Forensic Dossier: {t.threat_type}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-[#192837]/45 font-mono">#{t.id.slice(0, 8).toUpperCase()}</span>
                            <span className={`sev-badge ${sc}`}>{t.severity}</span>
                            <span className="text-[11px] text-[#192837]/45">Risk: {t.risk_score}/100 · {t.status.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdfReport(t.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7342E2] text-white text-xs font-bold hover:bg-[#6032C4] shadow-xs cursor-pointer transition-all shrink-0"
                      >
                        <Download size={13} />
                        Download PDF
                      </button>
                    </div>
                  )
                }) : (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] border border-[#E0D9FF] flex items-center justify-center mx-auto">
                      <FileText size={26} className="text-[#7342E2]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#192837]">No forensic dossiers available</p>
                      <p className="text-xs text-[#192837]/45 mt-0.5">Reports are generated automatically when threats are detected</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Forensic Modal */}
        <ForensicsModal
          threatId={selectedThreatId}
          onClose={() => setSelectedThreatId(null)}
          onStatusUpdated={loadInvestigatorData}
        />
      </div>
    </div>
  )
}

export default InvestigatorDashboard
