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
  critical: { bg: 'bg-[#FF1E2D]/10', text: 'text-[#FF1E2D]', border: 'border-[#FF1E2D]/30', dot: 'bg-[#FF1E2D]', barColor: '#FF1E2D' },
  high: { bg: 'bg-[#FF5A36]/10', text: 'text-[#FF5A36]', border: 'border-[#FF5A36]/30', dot: 'bg-[#FF5A36]', barColor: '#FF5A36' },
  medium: { bg: 'bg-[#FFB020]/10', text: 'text-[#FFB020]', border: 'border-[#FFB020]/30', dot: 'bg-[#FFB020]', barColor: '#FFB020' },
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500', barColor: '#22C55E' },
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
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex flex-col md:flex-row font-body">

      {/* ── Sidebar ── */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-4 bg-[#0A0A0A] border-r border-[#2A2A2A]">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden gap-1">

            {/* Brand */}
            <div className="flex items-center gap-3 px-1 py-2 mb-5">
              <div className="shrink-0">
                <CyberTraceLogoIcon size={34} className="shrink-0" />
              </div>
              {sidebarOpen && (
                <div className="truncate animate-fade-in">
                  <span className="font-heading text-sm font-extrabold text-[#F5F5F5] tracking-tight block leading-tight">
                    Cyber<span className="text-[#FF1E2D]">Trace</span>
                  </span>
                  <span className="text-[9px] text-[#FF1E2D] font-bold block uppercase tracking-widest mt-0.5">
                    SOC Console
                  </span>
                </div>
              )}
            </div>

            {sidebarOpen && (
              <span className="section-label px-3 mb-1 text-[#737373] text-[10px] font-bold uppercase tracking-wider">Investigator Menu</span>
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
          <div className="border-t border-[#2A2A2A] pt-3 flex flex-col gap-0.5">
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
        <header className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#2A2A2A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="hidden sm:flex w-7 h-7 rounded-lg bg-[#181818] border border-[#2A2A2A] items-center justify-center shrink-0">
                {(() => {
                  const tab = investigatorTabs.find(t => t.id === activeTab)
                  const Icon = tab?.icon || BarChart3
                  return <Icon size={14} className="text-[#FF1E2D]" />
                })()}
              </div>
              <span className="font-heading text-sm font-bold text-[#F5F5F5] truncate">
                {investigatorTabs.find(t => t.id === activeTab)?.label || 'SOC Console'}
              </span>
              <span className="hidden sm:inline text-[10px] text-[#FF1E2D] font-extrabold uppercase px-2 py-0.5 rounded-lg bg-[#FF1E2D]/10 border border-[#FF1E2D]/20">
                Investigation Dossier
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Gmail Status */}
              {gmailStatus?.is_connected ? (
                <div title={`Gmail: ${gmailStatus?.email_address}`} className="px-3 py-1 rounded-full text-xs font-semibold bg-[#181818] border border-[#2A2A2A] text-[#F5F5F5] items-center gap-2 hidden sm:flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate max-w-[140px]">{gmailStatus?.email_address || 'Connected'}</span>
                </div>
              ) : (
                <div title="Gmail is disconnected." className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FF1E2D]/10 border border-[#FF1E2D]/30 text-[#FF1E2D] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF1E2D]" />
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
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#A3A3A3] hover:text-[#FF1E2D] hover:bg-[#181818] border border-[#2A2A2A] transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>

              <div className="h-4 w-px bg-[#2A2A2A]" />

              {/* Sign Out */}
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#A3A3A3] hover:text-[#FF1E2D] hover:bg-[#FF1E2D]/10 border border-[#2A2A2A] hover:border-[#FF1E2D]/30 transition-all cursor-pointer"
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
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#8B0000] via-[#1E0505] to-[#0A0A0A] text-white p-6 sm:p-8 shadow-xl border border-[#FF1E2D]/40">
                  {/* Radar pulse decoration */}
                  <div className="absolute right-6 top-6 w-24 h-24 pointer-events-none">
                    <div className="absolute inset-0 rounded-full border-2 border-[#FF1E2D]/30 animate-radar" />
                    <div className="absolute inset-2 rounded-full border border-[#FF1E2D]/20 animate-radar" style={{ animationDelay: '0.5s' }} />
                    <AlertTriangle size={32} className="absolute inset-0 m-auto text-[#FF1E2D]/50" />
                  </div>

                  <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-[10px] font-extrabold uppercase tracking-wider border border-white/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF1E2D] animate-ping" />
                        Highest Critical Threat — All Monitored Accounts
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-black/40 text-[#FF5A36] font-mono text-xs font-bold border border-[#FF5A36]/30">
                        #{mostDangerousThreat.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                      {mostDangerousThreat.threat_type} — Risk Score {mostDangerousThreat.risk_score}/100
                    </h2>

                    <p className="text-sm text-[#F5F5F5]/85 leading-relaxed line-clamp-2">
                      {mostDangerousThreat.summary || 'High-risk threat detected requiring urgent investigator triage and account lockdown.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-[#A3A3A3]">
                      <span>Severity: <strong className="text-[#FF1E2D] uppercase">{mostDangerousThreat.severity}</strong></span>
                      <span>·</span>
                      <span>Status: <strong className="text-white uppercase">{mostDangerousThreat.status}</strong></span>
                      <span>·</span>
                      <span>Confidence: <strong className="text-emerald-400">{Math.round((mostDangerousThreat.confidence || 0.96) * 100)}%</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
                    <button
                      type="button"
                      onClick={() => setSelectedThreatId(mostDangerousThreat.id)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#E50914] text-white font-extrabold text-xs hover:bg-[#FF1E2D] transition-all shadow-md cursor-pointer"
                    >
                      <Eye size={14} />
                      Deep Forensics Investigation
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdfReport(mostDangerousThreat.id)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#181818] text-[#F5F5F5] font-bold text-xs border border-[#2A2A2A] hover:bg-[#222222] transition-all shadow-md cursor-pointer"
                    >
                      <Download size={14} />
                      Download Incident PDF Dossier
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="p-4 rounded-2xl bg-[#111111] border border-[#2A2A2A] border-l-4 border-l-[#737373]">
                  <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-2">Emails Scanned</span>
                  <span className="font-heading text-3xl font-extrabold text-[#F5F5F5]">
                    {stats?.total_emails_scanned ?? (allEmails.length || threats.length)}
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold mt-1 block">Pipeline Active</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#111111] border border-[#2A2A2A] border-l-4 border-l-[#FF5A36]">
                  <span className="text-[10px] font-bold text-[#FF5A36] uppercase tracking-wider block mb-2">Total Threats</span>
                  <span className="font-heading text-3xl font-extrabold text-[#FF5A36]">
                    {stats?.total_threats ?? threats.length}
                  </span>
                  <span className="text-xs text-[#FF5A36]/70 font-semibold mt-1 block">via Gemini AI</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#111111] border border-[#2A2A2A] border-l-4 border-l-[#FF1E2D]">
                  <span className="text-[10px] font-bold text-[#FF1E2D] uppercase tracking-wider block mb-2">Critical Threats</span>
                  <span className="font-heading text-3xl font-extrabold text-[#FF1E2D]">
                    {stats?.critical_threats ?? threats.filter(t => t.severity === 'critical').length}
                  </span>
                  <span className="text-xs text-[#FF1E2D]/70 font-semibold mt-1 block">Immediate Alert</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#111111] border border-[#2A2A2A] border-l-4 border-l-blue-500">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-2">Monitored Users</span>
                  <span className="font-heading text-3xl font-extrabold text-blue-400">
                    {usersList.length || 1}
                  </span>
                  <span className="text-xs text-blue-300/70 font-semibold mt-1 block">Enterprise RBAC</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#111111] border border-[#2A2A2A] border-l-4 border-l-[#FFB020] col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-[#FFB020] uppercase tracking-wider block mb-2">Suspicious IPs</span>
                  <span className="font-heading text-3xl font-extrabold text-[#FFB020]">
                    {stats?.suspicious_ip_count ?? 4}
                  </span>
                  <span className="text-xs text-[#FFB020]/70 font-semibold mt-1 block">IPQS Validated</span>
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
                        <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${sev.text}`}>{label}</span>
                        <span className={`font-heading text-2xl font-extrabold ${sev.text}`}>{count}</span>
                      </div>
                      <Icon size={20} className={`${sev.text} opacity-70`} />
                    </div>
                  )
                })}
              </div>

              {/* Analytics + User Leaderboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Threat Type Distribution */}
                <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] space-y-5">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-[#F5F5F5]">Threat Vector Analytics</h3>
                    <p className="text-xs text-[#737373] mt-0.5">Distribution across mail streams</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: 'Phishing Attacks', count: stats?.phishing_count || threats.filter(t => t.threat_type.toLowerCase().includes('phish')).length, color: '#FF1E2D' },
                      { label: 'Business Email Compromise', count: stats?.bec_count || threats.filter(t => t.threat_type.toLowerCase().includes('bec') || t.threat_type.toLowerCase().includes('compromise')).length, color: '#FF5A36' },
                      { label: 'Credential Theft / Fraud', count: stats?.fraud_count || threats.filter(t => t.threat_type.toLowerCase().includes('fraud') || t.threat_type.toLowerCase().includes('theft')).length, color: '#991B1B' },
                      { label: 'Malware Vectors', count: stats?.malware_count || threats.filter(t => t.threat_type.toLowerCase().includes('malware')).length, color: '#FFB020' },
                    ].map((cat, idx) => {
                      const total = Math.max(1, threats.length)
                      const pct = Math.round((cat.count / total) * 100)
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-[#F5F5F5] flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                              {cat.label}
                            </span>
                            <span className="font-mono" style={{ color: cat.color }}>{cat.count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-[#0A0A0A] h-2 rounded-full overflow-hidden border border-[#2A2A2A]">
                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(4, pct)}%`, background: cat.color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('map')}
                    className="w-full py-2.5 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] text-xs font-bold text-[#FF1E2D] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Globe size={13} />
                    View Geographic Threat Map
                  </button>
                </div>

                {/* User Leaderboard */}
                <div className="lg:col-span-2 p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-sm font-bold text-[#F5F5F5]">Monitored Accounts Leaderboard</h3>
                      <p className="text-xs text-[#737373] mt-0.5">Click to inspect detailed telemetry</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('users')}
                      className="flex items-center gap-1 text-xs font-bold text-[#FF1E2D] hover:underline cursor-pointer"
                    >
                      All accounts ({usersList.length}) <ChevronRight size={13} />
                    </button>
                  </div>

                  <div className="divide-y divide-[#2A2A2A]">
                    {usersList.slice(0, 5).map((u, i) => (
                      <div key={i} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#181818] px-3 rounded-2xl transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#181818] border border-[#2A2A2A] text-[#FF1E2D] font-extrabold text-sm flex items-center justify-center">
                            {u.name ? u.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[#F5F5F5]">{u.name || 'Enterprise User'}</span>
                              <span className="px-2 py-0.5 rounded-full bg-[#181818] text-[#737373] text-[9px] font-bold uppercase border border-[#2A2A2A]">
                                {u.role}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#A3A3A3] font-mono">{u.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="text-xs font-bold text-[#FF5A36] bg-[#FF5A36]/10 border border-[#FF5A36]/30 px-2.5 py-1 rounded-xl">
                            {u.threats_count} threats
                          </span>
                          <button
                            type="button"
                            onClick={() => { setSelectedUser(u); setActiveTab('users') }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E50914] hover:bg-[#FF1E2D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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
              <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-[#F5F5F5]">Recent Incident Stream</h3>
                    <p className="text-xs text-[#737373] mt-0.5">Verified threat telemetry across monitored accounts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('threats')}
                    className="flex items-center gap-1 text-xs font-bold text-[#FF1E2D] hover:underline cursor-pointer"
                  >
                    All threats ({threats.length}) <ChevronRight size={13} />
                  </button>
                </div>

                {threats.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#181818] border border-[#2A2A2A] flex items-center justify-center mx-auto">
                      <Shield size={22} className="text-[#FF1E2D]" />
                    </div>
                    <p className="text-sm font-bold text-[#F5F5F5]">No threats detected</p>
                    <p className="text-xs text-[#737373]">Threat data will appear once users connect Gmail</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {threats.slice(0, 5).map(t => {
                      const sc = sevClass(t.severity)
                      const sev = sevColors[sc]
                      return (
                        <div key={t.id} className="p-4 rounded-2xl bg-[#181818] hover:bg-[#1E1E1E] border border-[#2A2A2A] transition-all">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${sev.bg} ${sev.text} ${sev.border}`}>{t.severity}</span>
                                <span className="font-heading text-sm font-bold text-[#F5F5F5] truncate">{t.threat_type}</span>
                                <span className="text-[10px] font-mono text-[#737373]">#{t.id.slice(0, 8).toUpperCase()}</span>
                                <span className="text-[10px] font-mono font-bold text-[#FF1E2D] bg-[#FF1E2D]/10 px-2 py-0.5 rounded-md border border-[#FF1E2D]/30">
                                  Risk {t.risk_score}/100
                                </span>
                              </div>
                              <p className="text-xs text-[#A3A3A3] line-clamp-1">{t.summary}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-center">
                              <button
                                type="button"
                                onClick={() => setSelectedThreatId(t.id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#111111] border border-[#2A2A2A] text-xs font-bold text-[#F5F5F5] hover:border-[#FF1E2D] hover:text-[#FF1E2D] transition-all cursor-pointer"
                              >
                                <Eye size={12} />
                                Forensics
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadPdfReport(t.id)}
                                title="Download PDF"
                                className="w-8 h-8 rounded-xl bg-[#111111] hover:bg-[#FF1E2D] hover:text-white text-[#FF1E2D] border border-[#2A2A2A] transition-all flex items-center justify-center cursor-pointer"
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
                <h1 className="font-heading text-2xl font-extrabold text-[#F5F5F5]">Threat Monitoring</h1>
                <p className="text-sm text-[#A3A3A3] mt-0.5">Full organizational security incidents with forensic lookup and risk metrics</p>
              </div>
              <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A]">
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
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111111] border border-[#2A2A2A] text-xs font-bold text-[#FF1E2D] hover:bg-[#181818] transition-all cursor-pointer shadow-xs"
                  >
                    <ArrowLeft size={13} />
                    Back to Monitored Accounts
                  </button>

                  {/* User Header Card */}
                  <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#181818] to-[#111111] border-2 border-[#FF1E2D]/40 text-[#FF1E2D] text-2xl font-extrabold flex items-center justify-center shadow-sm">
                        {selectedUser.name ? selectedUser.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-heading text-xl font-bold text-[#F5F5F5]">{selectedUser.name || 'Enterprise User Account'}</h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#181818] text-[#FF1E2D] font-bold text-[10px] uppercase border border-[#FF1E2D]/20">
                            {selectedUser.role}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-[#FF1E2D] font-bold mt-0.5">{selectedUser.email}</p>
                        <p className="text-[11px] text-[#737373] mt-0.5">
                          Account ID: <code className="font-mono text-[#A3A3A3]">{selectedUser.id}</code>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      {[
                        { label: 'Threats Logged', value: selectedUserThreats.length || selectedUser.threats_count || 0, color: 'text-[#FF5A36]' },
                        { label: 'Critical Threats', value: selectedUserThreats.filter(t => t.severity === 'critical').length || selectedUser.critical_count || 0, color: 'text-[#FF1E2D]' },
                        { label: 'Scanned Emails', value: selectedUserEmails.length || Math.max(selectedUserThreats.length, 1), color: 'text-[#F5F5F5]' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="p-3.5 rounded-2xl bg-[#181818] border border-[#2A2A2A] text-center min-w-[110px]">
                          <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1">{label}</span>
                          <span className={`text-xl font-extrabold font-mono ${color}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User Threats Table */}
                  <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] space-y-4">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">Emails & Threats Analyzed</h3>
                      <p className="text-xs text-[#737373]">for {selectedUser.email}</p>
                    </div>

                    {selectedUserThreats.length === 0 ? (
                      <div className="py-14 text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                          <CheckCircle size={26} className="text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#F5F5F5]">No Threat Incidents Logged</p>
                          <p className="text-xs text-[#737373] mt-0.5">This enterprise user account is clean and protected.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedUserThreats.map(t => {
                          const sc = sevClass(t.severity)
                          const sev = sevColors[sc]
                          return (
                            <div key={t.id} className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A]">
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${sev.bg} ${sev.text} ${sev.border}`}>{t.severity}</span>
                                    <span className="font-heading text-sm font-bold text-[#F5F5F5]">{t.threat_type}</span>
                                    <span className="text-[10px] font-mono text-[#737373]">#{t.id.slice(0, 8).toUpperCase()}</span>
                                    <span className="text-[10px] font-mono font-bold text-[#FF1E2D] bg-[#FF1E2D]/10 px-2 py-0.5 rounded-md border border-[#FF1E2D]/30">
                                      Risk: {t.risk_score}/100
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#A3A3A3] leading-relaxed">
                                    {t.summary || 'Scanned email content flagged for potential cybersecurity risks.'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#737373] font-mono">
                                    <span>Status: <strong className="uppercase text-[#F5F5F5]">{t.status}</strong></span>
                                    <span>·</span>
                                    <span>{new Date(t.created_at).toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                  <button
                                    type="button"
                                    onClick={() => { setCopilotSelectedEmailId(t.email_id || t.id); setActiveTab('copilot') }}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#111111] hover:bg-[#FF1E2D] hover:text-white text-[#FF1E2D] border border-[#2A2A2A] text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Cpu size={12} />
                                    Copilot
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedThreatId(t.id)}
                                    className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[#E50914] hover:bg-[#FF1E2D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                                  >
                                    <Eye size={12} />
                                    Forensics
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadPdfReport(t.id)}
                                    className="w-8 h-8 rounded-xl bg-[#111111] hover:bg-[#181818] text-[#FF1E2D] border border-[#2A2A2A] flex items-center justify-center cursor-pointer transition-all"
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
                      <h1 className="font-heading text-2xl font-extrabold text-[#F5F5F5]">Monitored Enterprise Accounts</h1>
                      <p className="text-sm text-[#A3A3A3] mt-0.5">{filteredUsers.length} accounts · RBAC monitored threat telemetry</p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search by name or email…"
                        className="w-full text-xs px-4 py-2.5 pl-9 rounded-xl bg-[#111111] border border-[#2A2A2A] text-[#F5F5F5] placeholder-[#737373] focus:outline-none focus:border-[#FF1E2D] transition-colors"
                      />
                      <Search size={13} className="absolute left-3 top-3 text-[#737373]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredUsers.map((u, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedUser(u)}
                        className="p-5 rounded-3xl bg-[#111111] border border-[#2A2A2A] hover:border-[#FF1E2D]/40 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-[#181818] border border-[#2A2A2A] text-[#FF1E2D] font-extrabold text-base flex items-center justify-center group-hover:bg-[#E50914] group-hover:text-white transition-all">
                              {u.name ? u.name[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <span className="font-bold text-sm text-[#F5F5F5] block group-hover:text-[#FF1E2D] transition-colors">
                                {u.name || 'Enterprise User'}
                              </span>
                              <span className="text-xs text-[#737373] font-mono">{u.email}</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-[#181818] border border-[#2A2A2A] font-bold uppercase text-[10px] text-[#A3A3A3]">
                            {u.role}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[#2A2A2A] text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#FF5A36] bg-[#FF5A36]/10 border border-[#FF5A36]/30 px-2.5 py-0.5 rounded-lg">
                              {u.threats_count} Threats
                            </span>
                            {u.critical_count > 0 && (
                              <span className="font-bold text-[#FF1E2D] bg-[#FF1E2D]/10 border border-[#FF1E2D]/30 px-2.5 py-0.5 rounded-lg">
                                {u.critical_count} Critical
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-[#FF1E2D] group-hover:translate-x-1 transition-transform flex items-center gap-1">
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
                <h1 className="font-heading text-2xl font-extrabold text-[#F5F5F5]">Threat Analytics</h1>
                <p className="text-sm text-[#A3A3A3] mt-0.5">Statistical breakdown of organizational threat vectors</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Threat Vector Distribution */}
                <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] space-y-4">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-[#F5F5F5]">Threat Vector Distribution</h3>
                    <p className="text-xs text-[#737373] mt-0.5">Classified by Gemini AI inference pipeline</p>
                  </div>
                  <div className="space-y-3">
                    {(analytics?.threat_distribution || []).map((item: any, i: number) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-[#F5F5F5]">{item.name}</span>
                          <span className="text-[#FF1E2D]">{item.percentage}% ({item.count || 0})</span>
                        </div>
                        <div className="w-full bg-[#0A0A0A] h-2 rounded-full overflow-hidden border border-[#2A2A2A]">
                          <div className="h-full bg-[#FF1E2D] rounded-full" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                    {(!analytics?.threat_distribution || analytics.threat_distribution.length === 0) && (
                      <p className="text-xs text-[#737373] py-6 text-center">No distribution data available yet.</p>
                    )}
                  </div>
                </div>

                {/* Geographic Distribution */}
                <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] space-y-4">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-[#F5F5F5]">Origin Geographic Sources</h3>
                    <p className="text-[11px] text-[#737373] mt-0.5">IP-based approximate location — not exact physical address</p>
                  </div>
                  <div className="space-y-2.5">
                    {(analytics?.geographic_distribution || []).map((geo: any, i: number) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-[#181818] border border-[#2A2A2A] flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin size={13} className="text-[#FF1E2D] shrink-0" />
                          <span className="font-bold text-[#F5F5F5]">{geo.country} ({geo.code})</span>
                        </div>
                        <span className="font-mono font-bold text-[#FF1E2D] bg-[#FF1E2D]/10 border border-[#FF1E2D]/30 px-2.5 py-0.5 rounded-lg text-xs">{geo.threats} Detected</span>
                      </div>
                    ))}
                    {(!analytics?.geographic_distribution || analytics.geographic_distribution.length === 0) && (
                      <p className="text-xs text-[#737373] py-6 text-center">Geographic data will appear after scans with IP resolution.</p>
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
                <h1 className="font-heading text-2xl font-extrabold text-[#F5F5F5]">Forensic Incident Dossiers</h1>
                <p className="text-sm text-[#A3A3A3] mt-0.5">{threats.length} court-admissible PDF forensic dossiers available</p>
              </div>

              <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] space-y-3">
                {threats.length > 0 ? threats.map(t => {
                  const sc = sevClass(t.severity)
                  const sev = sevColors[sc]
                  return (
                    <div key={t.id} className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] hover:border-[#FF1E2D]/40 flex items-center justify-between gap-4 transition-all">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#111111] border border-[#2A2A2A] text-[#FF1E2D] flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-[#F5F5F5] block truncate">
                            Forensic Dossier: {t.threat_type}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-[#737373] font-mono">#{t.id.slice(0, 8).toUpperCase()}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${sev.bg} ${sev.text} ${sev.border}`}>{t.severity}</span>
                            <span className="text-[11px] text-[#A3A3A3]">Risk: {t.risk_score}/100 · {t.status.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdfReport(t.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E50914] text-white text-xs font-bold hover:bg-[#FF1E2D] shadow-xs cursor-pointer transition-all shrink-0"
                      >
                        <Download size={13} />
                        Download PDF
                      </button>
                    </div>
                  )
                }) : (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#181818] border border-[#2A2A2A] flex items-center justify-center mx-auto">
                      <FileText size={26} className="text-[#FF1E2D]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#F5F5F5]">No forensic dossiers available</p>
                      <p className="text-xs text-[#737373] mt-0.5">Reports are generated automatically when threats are detected</p>
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
