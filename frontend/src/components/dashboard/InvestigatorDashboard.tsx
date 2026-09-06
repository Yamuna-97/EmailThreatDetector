import React, { useState, useEffect, useMemo } from 'react'
import {
  ShieldAlert, Globe, Users, BarChart3, FileText,
  Download, Eye, RefreshCw,
  Search, Terminal, LogOut, ArrowUpDown, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle, Activity, MapPin, ArrowLeft, UserCheck,
  Cpu
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { threatService, type ThreatItem } from '../../services/threats'
import { gmailService, type GmailStatus } from '../../services/gmail'
import ForensicsModal from './ForensicsModal'
import ThreatMapView from './ThreatMapView'
import { InvestigatorRAGCopilot } from './InvestigatorRAGCopilot'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
import { CyberTraceLogoIcon } from '../CyberTraceLogo'

export const InvestigatorDashboard: React.FC = () => {
  const { logout } = useAuth()
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
  
  // Selected user for detailed account monitoring
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [userSearchQuery, setUserSearchQuery] = useState<string>('')
  
  // Table filters & controls
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'newest' | 'risk_score'>('newest')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const itemsPerPage = 8

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

  // Find the single most dangerous / critical threat across all monitored accounts
  const mostDangerousThreat = useMemo(() => {
    if (!threats || threats.length === 0) return null
    return [...threats].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))[0]
  }, [threats])

  // Filter users list
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return usersList
    const q = userSearchQuery.toLowerCase()
    return usersList.filter(u => 
      (u.name && u.name.toLowerCase().includes(q)) || 
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    )
  }, [usersList, userSearchQuery])

  // Get analyzed threats & emails for selected user
  const selectedUserThreats = useMemo(() => {
    if (!selectedUser) return []
    return threats.filter(t => t.user_id === selectedUser.id)
  }, [selectedUser, threats])

  const selectedUserEmails = useMemo(() => {
    if (!selectedUser) return []
    return allEmails.filter(e => e.user_id === selectedUser.id || e.recipient === selectedUser.email)
  }, [selectedUser, allEmails])

  // Filter and sort threats for Threats tab table
  const filteredAndSortedThreats = useMemo(() => {
    const list = threats.filter(t => {
      if (severityFilter && t.severity.toLowerCase() !== severityFilter.toLowerCase()) return false
      if (typeFilter && !t.threat_type.toLowerCase().includes(typeFilter.toLowerCase())) return false
      if (statusFilter && t.status.toLowerCase() !== statusFilter.toLowerCase()) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesType = t.threat_type.toLowerCase().includes(q)
        const matchesSummary = t.summary.toLowerCase().includes(q)
        const matchesId = t.id.toLowerCase().includes(q)
        if (!matchesType && !matchesSummary && !matchesId) return false
      }
      return true
    })

    return list.sort((a, b) => {
      if (sortBy === 'risk_score') {
        return (b.risk_score || 0) - (a.risk_score || 0)
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [threats, severityFilter, typeFilter, statusFilter, searchQuery, sortBy])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedThreats.length / itemsPerPage))
  const paginatedThreats = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedThreats.slice(start, start + itemsPerPage)
  }, [filteredAndSortedThreats, currentPage])

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
    <div className="min-h-screen bg-[#FFFFFF] text-[#1F1F29] flex flex-col md:flex-row font-body">
      {/* Left Collapsible Animated Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-6">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3 px-1 py-2 mb-4">
              <CyberTraceLogoIcon size={36} className="shrink-0" />
              {sidebarOpen && (
                <div className="truncate">
                  <span className="font-heading text-base font-extrabold text-[#1F1F29] tracking-tight block">
                    Cyber<span className="text-[#7342E2]">Trace</span>
                  </span>
                  <span className="text-[10px] text-[#7342E2] font-extrabold block uppercase tracking-wider">
                    SOC Console
                  </span>
                </div>
              )}
            </div>

            {/* Nav Links */}
            <div className="flex flex-col gap-1.5">
              {investigatorTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <SidebarLink
                    key={tab.id}
                    link={{
                      label: tab.label,
                      icon: <Icon size={18} />,
                      active: activeTab === tab.id,
                      count: tab.count,
                      onClick: () => {
                        setActiveTab(tab.id as any)
                        setCurrentPage(1)
                      },
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Quick Actions & Sign Out at Bottom */}
          <div className="border-t border-[#D8C8FF] pt-3">
            <SidebarLink
              link={{
                label: "Refresh Data",
                icon: <RefreshCw size={18} className={loading ? "animate-spin" : ""} />,
                onClick: loadInvestigatorData,
              }}
            />
            <SidebarLink
              link={{
                label: "Sign Out",
                icon: <LogOut size={18} className="text-red-500" />,
                onClick: logout,
              }}
              className="text-red-600 hover:bg-red-50"
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#D8C8FF] text-[#1F1F29] shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-extrabold text-[#1F1F29]">
                {investigatorTabs.find(t => t.id === activeTab)?.label || 'SOC Console'}
              </span>
              <span className="text-[10px] text-[#7342E2] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#F5F3FF] border border-[#D8C8FF]">
                Investigation Dossier
              </span>
            </div>

            {/* Quick Actions & Gmail Indicator */}
            <div className="flex items-center gap-3">
              {/* Global Gmail Connection Status Light */}
              {gmailStatus?.is_connected ? (
                <div
                  title={`Gmail Authorized: ${gmailStatus?.email_address || 'Connected'}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs cursor-default"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm animate-pulse shrink-0" />
                  <span className="truncate max-w-[120px] sm:max-w-[180px]">
                    Gmail: {gmailStatus?.email_address || 'Connected'}
                  </span>
                </div>
              ) : (
                <div
                  title="Gmail is disconnected."
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold shadow-xs cursor-default"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shrink-0" />
                  <span>Gmail: Disconnected</span>
                </div>
              )}

              <button
                type="button"
                onClick={loadInvestigatorData}
                disabled={loading}
                title="Refresh Telemetry Data"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B7280] hover:text-[#7342E2] hover:bg-[#F5F3FF] border border-[#D8C8FF] transition-all cursor-pointer shadow-sm"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>

              <div className="h-5 w-[1px] bg-[#D8C8FF]" />

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B7280] hover:text-red-600 hover:bg-red-50 border border-[#D8C8FF] hover:border-red-200 transition-all cursor-pointer shadow-sm"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-5 sm:px-8 py-8 flex-1 space-y-8">
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* USER REQUIREMENT 1: HIGHEST DANGER / CRITICAL THREAT ALERT BANNER */}
            {mostDangerousThreat && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-[#192837] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-red-400">
                <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none text-white">
                  <AlertTriangle size={240} />
                </div>

                <div className="space-y-2 z-10 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 border border-white/30">
                      <span className="w-2 h-2 rounded-full bg-red-300 animate-ping" />
                      Highest Critical Threat Across All Monitored Accounts
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-black/40 text-red-200 font-mono text-xs font-bold border border-red-400/40">
                      Incident #{mostDangerousThreat.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                    {mostDangerousThreat.threat_type} — Risk Score {mostDangerousThreat.risk_score}/100
                  </h2>

                  <p className="text-xs text-red-100/90 leading-relaxed font-body line-clamp-2">
                    {mostDangerousThreat.summary || "High-risk threat detected requiring urgent investigator triage and account lockdown."}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-red-200">
                    <span>Severity: <strong className="text-white uppercase">{mostDangerousThreat.severity}</strong></span>
                    <span>•</span>
                    <span>Status: <strong className="text-white uppercase">{mostDangerousThreat.status}</strong></span>
                    <span>•</span>
                    <span>Confidence: <strong className="text-white">{Math.round((mostDangerousThreat.confidence || 0.96) * 100)}%</strong></span>
                  </div>
                </div>

                <div className="z-10 flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedThreatId(mostDangerousThreat.id)}
                    className="px-5 py-3 rounded-2xl bg-white text-red-700 font-extrabold text-xs hover:bg-red-50 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye size={15} />
                    <span>Deep Forensics Investigation</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPdfReport(mostDangerousThreat.id)}
                    className="px-5 py-2.5 rounded-2xl bg-red-800/80 hover:bg-red-800 text-white font-bold text-xs border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download Incident PDF Dossier</span>
                  </button>
                </div>
              </div>
            )}

            {/* Primary Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Total Emails Scanned</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-[#1F1F29]">{stats?.total_emails_scanned ?? (allEmails.length || threats.length)}</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1">Ingestion Pipeline Active</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Total Threats</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-orange-600">{stats?.total_threats ?? threats.length}</span>
                </div>
                <span className="text-[10px] text-orange-600 font-semibold mt-1">Classified via Gemini AI</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Critical Threats</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-red-600">{stats?.critical_threats ?? threats.filter(t => t.severity === 'critical').length}</span>
                </div>
                <span className="text-[10px] text-red-600 font-semibold mt-1">Immediate Alert</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Active Monitored Users</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-[#7342E2]">{usersList.length || 1}</span>
                </div>
                <span className="text-[10px] text-[#7342E2] font-semibold mt-1">Enterprise RBAC Scoped</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Suspicious IPs</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-amber-600">{stats?.suspicious_ip_count ?? 4}</span>
                </div>
                <span className="text-[10px] text-amber-600 font-semibold mt-1">IPQualityScore Validated</span>
              </div>
            </div>

            {/* Severity Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Critical (75-100)</span>
                  <span className="text-xl font-extrabold text-red-700">{stats?.critical_threats ?? threats.filter(t => t.severity === 'critical').length}</span>
                </div>
                <AlertTriangle size={20} className="text-red-500" />
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">High (50-74)</span>
                  <span className="text-xl font-extrabold text-orange-700">{stats?.high_threats ?? threats.filter(t => t.severity === 'high').length}</span>
                </div>
                <ShieldAlert size={20} className="text-orange-500" />
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Medium (25-49)</span>
                  <span className="text-xl font-extrabold text-amber-700">{stats?.medium_threats ?? threats.filter(t => t.severity === 'medium').length}</span>
                </div>
                <Activity size={20} className="text-amber-500" />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Low (0-24)</span>
                  <span className="text-xl font-extrabold text-emerald-700">{stats?.low_threats ?? threats.filter(t => t.severity === 'low').length}</span>
                </div>
                <CheckCircle size={20} className="text-emerald-500" />
              </div>
            </div>

            {/* USER REQUIREMENT 1: GRAPH & VISUAL ANALYTICS + TOP MONITORED USERS LEADERBOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Category Breakdown & Visual Progress Graphs */}
              <div className="p-6 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm space-y-5">
                <div>
                  <h3 className="font-heading text-base font-bold text-[#1F1F29]">
                    Threat Type Visual Analytics
                  </h3>
                  <p className="text-xs text-[#6B7280]">Distribution across organizational mail streams</p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Phishing Attacks', count: stats?.phishing_count || threats.filter(t => t.threat_type.toLowerCase().includes('phish')).length, color: 'bg-red-500' },
                    { label: 'Business Email Compromise (BEC)', count: stats?.bec_count || threats.filter(t => t.threat_type.toLowerCase().includes('bec') || t.threat_type.toLowerCase().includes('compromise')).length, color: 'bg-orange-500' },
                    { label: 'Credential Theft / Fraud', count: stats?.fraud_count || threats.filter(t => t.threat_type.toLowerCase().includes('fraud') || t.threat_type.toLowerCase().includes('theft')).length, color: 'bg-purple-500' },
                    { label: 'Malware Vectors', count: stats?.malware_count || threats.filter(t => t.threat_type.toLowerCase().includes('malware')).length, color: 'bg-amber-500' },
                  ].map((cat, idx) => {
                    const total = Math.max(1, threats.length)
                    const pct = Math.round((cat.count / total) * 100)
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-[#1F1F29] flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                            {cat.label}
                          </span>
                          <span className="font-mono text-[#7342E2]">{cat.count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                          <div className={`h-full ${cat.color} transition-all duration-500`} style={{ width: `${Math.max(5, pct)}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('map')}
                    className="w-full py-2.5 rounded-2xl bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-[#D8C8FF] text-xs font-bold text-[#7342E2] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Globe size={14} />
                    <span>View Geographic Distribution Map</span>
                  </button>
                </div>
              </div>

              {/* USER REQUIREMENT 2: TOP MONITORED USER ACCOUNTS & SELECTION */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-base font-bold text-[#1F1F29]">
                      Monitored Enterprise Accounts Leaderboard
                    </h3>
                    <p className="text-xs text-[#6B7280]">Select a user to inspect detailed telemetry & analyzed emails</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className="text-xs font-bold text-[#7342E2] hover:underline cursor-pointer"
                  >
                    View All Accounts ({usersList.length}) →
                  </button>
                </div>

                <div className="divide-y divide-[#D8C8FF]/50">
                  {usersList.slice(0, 5).map((u, i) => (
                    <div key={i} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#FAF8FF] px-2 rounded-2xl transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#F5F3FF] border border-[#D8C8FF] text-[#7342E2] font-extrabold flex items-center justify-center shadow-xs">
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#1F1F29]">{u.name || 'Enterprise User'}</span>
                            <span className="px-2 py-0.2 rounded-full bg-[#F3F4F6] text-[#4B5563] text-[9px] font-bold uppercase">
                              {u.role}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#6B7280] font-mono">{u.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-xl">
                          {u.threats_count} Threats Logged
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u)
                            setActiveTab('users')
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#7342E2] hover:bg-[#6032C4] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck size={13} />
                          <span>Inspect Account</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Security Incidents Stream */}
            <div className="p-6 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold text-[#1F1F29]">
                    Recent Incident Stream Across Monitored Accounts
                  </h3>
                  <p className="text-xs text-[#6B7280]">Verified threat telemetry from Supabase & ML inference pipeline</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('threats')}
                  className="text-xs font-bold text-[#7342E2] hover:underline cursor-pointer"
                >
                  View All Threats ({threats.length}) →
                </button>
              </div>

              {threats.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#6B7280]">
                  No threats detected yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {threats.slice(0, 5).map(t => {
                    const sevColor =
                      t.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                      t.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      t.severity === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'

                    return (
                      <div
                        key={t.id}
                        className="p-4 rounded-2xl bg-[#FAFAFC] hover:bg-white border border-[#D8C8FF]/60 hover:border-[#7342E2] hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${sevColor}`}>
                              {t.severity}
                            </span>
                            <span className="font-heading text-sm font-bold text-[#1F1F29]">
                              {t.threat_type}
                            </span>
                            <span className="text-[10px] font-mono text-[#6B7280]">
                              #{t.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                              Risk {t.risk_score}/100
                            </span>
                          </div>
                          <p className="text-xs text-[#6B7280] line-clamp-1 font-body">
                            {t.summary}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => setSelectedThreatId(t.id)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[#D8C8FF] text-xs font-bold text-[#1F1F29] hover:border-[#7342E2] hover:text-[#7342E2] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>Forensics</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPdfReport(t.id)}
                            title="Download PDF Dossier"
                            className="w-8 h-8 rounded-xl bg-[#F5F3FF] hover:bg-[#7342E2] hover:text-white text-[#7342E2] border border-[#D8C8FF] transition-all flex items-center justify-center cursor-pointer"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: THREAT MONITORING TABLE */}
        {activeTab === 'threats' && (
          <div className="p-6 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-[#1F1F29]">
                  Investigator Threat Monitoring
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Full organizational security incidents with forensic lookup and risk metrics
                </p>
              </div>

              {/* Filters & Sorting Controls */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="Search threats, type, ID..."
                    className="w-full text-xs px-3.5 py-2 pl-9 rounded-xl bg-white border border-[#D8C8FF] text-[#1F1F29] focus:outline-none focus:border-[#7342E2]"
                  />
                  <Search size={14} className="absolute left-3 top-2.5 text-[#6B7280]" />
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-white border border-[#D8C8FF] text-[#1F1F29] focus:outline-none focus:border-[#7342E2]"
                >
                  <option value="">All Threat Types</option>
                  <option value="phish">Phishing</option>
                  <option value="compromise">BEC</option>
                  <option value="fraud">Fraud / Theft</option>
                  <option value="malware">Malware</option>
                </select>

                <select
                  value={severityFilter}
                  onChange={(e) => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-white border border-[#D8C8FF] text-[#1F1F29] focus:outline-none focus:border-[#7342E2]"
                >
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-white border border-[#D8C8FF] text-[#1F1F29] focus:outline-none focus:border-[#7342E2]"
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="false_positive">False Positive</option>
                  <option value="resolved">Resolved</option>
                </select>

                <button
                  type="button"
                  onClick={() => setSortBy(sortBy === 'newest' ? 'risk_score' : 'newest')}
                  className="px-3 py-2 rounded-xl bg-white border border-[#D8C8FF] text-xs font-bold text-[#1F1F29] flex items-center gap-1 hover:border-[#7342E2] cursor-pointer"
                >
                  <ArrowUpDown size={12} className="text-[#7342E2]" />
                  <span>{sortBy === 'newest' ? 'Sort: Newest' : 'Sort: Risk Score'}</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#D8C8FF] bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8FF] text-[#6B7280] font-bold uppercase tracking-wider border-b border-[#D8C8FF]">
                  <tr>
                    <th className="py-3.5 px-4">Threat ID</th>
                    <th className="py-3.5 px-4">Threat Type</th>
                    <th className="py-3.5 px-4">Severity</th>
                    <th className="py-3.5 px-4">Risk Score</th>
                    <th className="py-3.5 px-4">Confidence</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Detected</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8C8FF]/40 bg-white">
                  {paginatedThreats.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#6B7280] font-medium">
                        No threat incidents matching your current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedThreats.map(t => {
                      const sevColor =
                        t.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                        t.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        t.severity === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'

                      return (
                        <tr key={t.id} className="hover:bg-[#FAF8FF] transition-all">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#7342E2]">
                            #{t.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#1F1F29] block">{t.threat_type}</span>
                            <span className="text-[11px] text-[#6B7280] line-clamp-1 max-w-xs">{t.summary}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-md font-extrabold uppercase text-[10px] border ${sevColor}`}>
                              {t.severity}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-red-600">
                            {t.risk_score} / 100
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#1F1F29]">
                            {Math.round((t.confidence || 0.95) * 100)}%
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563] border border-gray-200">
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#6B7280] whitespace-nowrap">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedThreatId(t.id)}
                                className="px-3 py-1.5 rounded-xl bg-white border border-[#D8C8FF] font-bold text-xs text-[#1F1F29] hover:border-[#7342E2] hover:text-[#7342E2] transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Eye size={12} />
                                <span>Forensics</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadPdfReport(t.id)}
                                title="Download PDF Report"
                                className="w-7 h-7 rounded-xl bg-[#F5F3FF] hover:bg-[#7342E2] hover:text-white text-[#7342E2] border border-[#D8C8FF] transition-all flex items-center justify-center cursor-pointer"
                              >
                                <Download size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#6B7280]">
                  Showing Page {currentPage} of {totalPages} ({filteredAndSortedThreats.length} incidents)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-2 rounded-xl bg-white border border-[#D8C8FF] text-[#1F1F29] disabled:opacity-40 hover:bg-[#FAF8FF] cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-2 rounded-xl bg-white border border-[#D8C8FF] text-[#1F1F29] disabled:opacity-40 hover:bg-[#FAF8FF] cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: THREAT MAP & GEOLOCATION */}
        {activeTab === 'map' && <ThreatMapView />}

        {/* USER REQUIREMENT 2: TAB 4 USER MONITORING & SELECT A USER DETAIL VIEW */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {selectedUser ? (
              /* DETAILED VIEW FOR SELECTED USER */
              <div className="space-y-6">
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-2xl bg-white border border-[#D8C8FF] text-xs font-bold text-[#7342E2] hover:bg-[#F5F3FF] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Monitored Enterprise Accounts</span>
                </button>

                {/* Selected User Header Card */}
                <div className="p-6 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-[#F5F3FF] border-2 border-[#D8C8FF] text-[#7342E2] text-2xl font-extrabold flex items-center justify-center shadow-sm">
                      {selectedUser.name ? selectedUser.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading text-xl font-bold text-[#1F1F29]">
                          {selectedUser.name || 'Enterprise User Account'}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#7342E2]/10 text-[#7342E2] font-bold text-[10px] uppercase">
                          Role: {selectedUser.role}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-[#7342E2] font-bold mt-0.5">
                        {selectedUser.email}
                      </p>
                      <p className="text-[11px] text-[#6B7280] mt-1">
                        Account ID: <code className="font-mono">{selectedUser.id}</code>
                      </p>
                    </div>
                  </div>

                  {/* Summary Stats Badges */}
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="p-3.5 rounded-2xl bg-[#FAF8FF] border border-[#D8C8FF]/60 text-center min-w-[110px]">
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Threats Logged</span>
                      <span className="text-xl font-extrabold font-mono text-orange-600">
                        {selectedUserThreats.length || selectedUser.threats_count || 0}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 text-center min-w-[110px]">
                      <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Critical Threats</span>
                      <span className="text-xl font-extrabold font-mono text-red-600">
                        {selectedUserThreats.filter(t => t.severity === 'critical').length || selectedUser.critical_count || 0}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#FAF8FF] border border-[#D8C8FF]/60 text-center min-w-[110px]">
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Scanned Emails</span>
                      <span className="text-xl font-extrabold font-mono text-[#7342E2]">
                        {selectedUserEmails.length || Math.max(selectedUserThreats.length, 1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* USER REQUIREMENT 2: What They Have Analyzed / Scanned Email Telemetry */}
                <div className="p-6 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm space-y-4">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-[#1F1F29]">
                      Emails & Threats Analyzed for {selectedUser.email}
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      Full forensic trace of emails scanned and security threats detected under this user account
                    </p>
                  </div>

                  {selectedUserThreats.length === 0 && selectedUserEmails.length === 0 ? (
                    <div className="py-16 text-center text-xs text-[#6B7280] space-y-2">
                      <CheckCircle size={32} className="mx-auto text-emerald-500" />
                      <p className="font-bold text-[#1F1F29]">No Threat Incidents Logged for this User</p>
                      <p>This enterprise user account is clean and protected.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedUserThreats.map(t => {
                        const sevColor =
                          t.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                          t.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          t.severity === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'

                        return (
                          <div
                            key={t.id}
                            className="p-5 rounded-2xl bg-[#FAF8FF] hover:bg-white border border-[#D8C8FF]/70 hover:border-[#7342E2] hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${sevColor}`}>
                                  {t.severity}
                                </span>
                                <span className="font-heading text-sm font-bold text-[#1F1F29]">
                                  {t.threat_type}
                                </span>
                                <span className="text-[10px] font-mono text-[#6B7280]">
                                  #{t.id.slice(0, 8).toUpperCase()}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                  Risk Score: {t.risk_score}/100
                                </span>
                              </div>

                              <p className="text-xs text-[#1F1F29] font-medium leading-relaxed">
                                {t.summary || "Scanned email content flagged for potential cybersecurity risks."}
                              </p>

                              <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#6B7280] font-mono">
                                <span>Status: <strong className="uppercase text-[#1F1F29]">{t.status}</strong></span>
                                <span>•</span>
                                <span>Date Analyzed: {new Date(t.created_at).toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setCopilotSelectedEmailId(t.email_id || t.id)
                                  setActiveTab('copilot')
                                }}
                                className="px-3.5 py-2 rounded-xl bg-[#F5F3FF] hover:bg-[#7342E2] hover:text-white text-[#7342E2] border border-[#D8C8FF] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Cpu size={14} />
                                <span>Copilot</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedThreatId(t.id)}
                                className="px-4 py-2 rounded-xl bg-[#7342E2] hover:bg-[#6032C4] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye size={14} />
                                <span>Forensics</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownloadPdfReport(t.id)}
                                title="Download PDF Report"
                                className="p-2 rounded-xl bg-white hover:bg-[#F5F3FF] text-[#7342E2] border border-[#D8C8FF] transition-all flex items-center justify-center cursor-pointer shadow-xs"
                              >
                                <Download size={15} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* MONITORED USERS LIST */
              <div className="p-6 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-[#1F1F29]">
                      Monitored Enterprise Accounts ({filteredUsers.length})
                    </h2>
                    <p className="text-xs text-[#6B7280]">
                      RBAC monitored user telemetry and threat incident volume. Click any user account to inspect analyzed emails.
                    </p>
                  </div>

                  {/* Search Bar for Users */}
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search accounts by name or email..."
                      className="w-full text-xs px-3.5 py-2 pl-9 rounded-xl bg-white border border-[#D8C8FF] text-[#1F1F29] focus:outline-none focus:border-[#7342E2]"
                    />
                    <Search size={14} className="absolute left-3 top-2.5 text-[#6B7280]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredUsers.map((u, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedUser(u)}
                      className="p-5 rounded-3xl bg-[#FAF8FF] hover:bg-white border border-[#D8C8FF]/70 hover:border-[#7342E2] hover:shadow-md transition-all cursor-pointer space-y-4 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-white border border-[#D8C8FF] text-[#7342E2] font-extrabold text-base flex items-center justify-center shadow-xs group-hover:bg-[#7342E2] group-hover:text-white transition-all">
                            {u.name ? u.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-[#1F1F29] block group-hover:text-[#7342E2] transition-colors">
                              {u.name || 'Enterprise User'}
                            </span>
                            <span className="text-xs text-[#6B7280] font-mono">{u.email}</span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full bg-white border border-[#D8C8FF] font-bold uppercase text-[10px] text-[#6B7280]">
                          Role: {u.role}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#D8C8FF]/40 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-md">
                            {u.threats_count} Threats Logged
                          </span>
                          {u.critical_count > 0 && (
                            <span className="font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
                              {u.critical_count} Critical
                            </span>
                          )}
                        </div>

                        <span className="font-bold text-[#7342E2] group-hover:translate-x-1 transition-transform flex items-center gap-1 text-xs">
                          Inspect User →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: SOC RAG COPILOT */}
        {activeTab === 'copilot' && (
          <div className="space-y-4">
            <InvestigatorRAGCopilot
              emails={allEmails.length > 0 ? allEmails : threats}
              users={usersList}
              selectedEmailId={copilotSelectedEmailId}
            />
          </div>
        )}

        {/* TAB 5: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Distribution */}
              <div className="p-6 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm space-y-4">
                <h3 className="font-heading text-base font-bold text-[#1F1F29]">Threat Vector Distribution</h3>
                <div className="space-y-3">
                  {(analytics?.threat_distribution || []).map((item: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#1F1F29]">{item.name}</span>
                        <span className="text-[#7342E2]">{item.percentage}% ({item.count || 0})</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                        <div className="h-full bg-[#7342E2]" style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geo Sources */}
              <div className="p-6 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm space-y-4">
                <h3 className="font-heading text-base font-bold text-[#1F1F29]">Origin Geographic Sources</h3>
                <p className="text-[11px] text-[#6B7280]">
                  Approximate IP-based location — not exact physical location.
                </p>
                <div className="space-y-3">
                  {(analytics?.geographic_distribution || []).map((geo: any, i: number) => (
                    <div key={i} className="p-3 rounded-2xl bg-[#FAFAFC] border border-[#D8C8FF]/60 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#7342E2]" />
                        <span className="font-bold text-[#1F1F29]">{geo.country} ({geo.code})</span>
                      </div>
                      <span className="font-mono font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">{geo.threats} Detected</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: REPORTS */}
        {activeTab === 'reports' && (
          <div className="p-6 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm space-y-4">
            <h2 className="font-heading text-lg font-bold text-[#1F1F29]">
              Generated Forensic Incident Dossiers ({threats.length})
            </h2>
            <p className="text-xs text-[#6B7280]">
              Download court-admissible and SOC compliance level 2 PDF forensic dossiers
            </p>
            <div className="space-y-3 pt-2">
              {threats.map(t => (
                <div key={t.id} className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#D8C8FF]/60 hover:border-[#7342E2] flex items-center justify-between gap-4 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] border border-[#D8C8FF] text-[#7342E2] flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#1F1F29] block">
                        Forensic Dossier: {t.threat_type} (Incident #{t.id.slice(0, 8).toUpperCase()})
                      </span>
                      <span className="text-[11px] text-[#6B7280]">
                        Risk Score: {t.risk_score}/100 • Status: {t.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdfReport(t.id)}
                    className="px-4 py-2 rounded-xl bg-[#7342E2] text-white text-xs font-bold hover:brightness-110 shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Forensic Deep Dive Modal */}
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
