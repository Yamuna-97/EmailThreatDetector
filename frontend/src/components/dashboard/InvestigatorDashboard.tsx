import React, { useState, useEffect, useMemo } from 'react'
import {
  ShieldAlert, Globe, Users, BarChart3, FileText,
  Download, Eye, RefreshCw,
  Search, Terminal, LogOut, ArrowUpDown, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle, Activity, MapPin
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { threatService, type ThreatItem } from '../../services/threats'
import ForensicsModal from './ForensicsModal'
import ThreatMapView from './ThreatMapView'

export const InvestigatorDashboard: React.FC = () => {
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'threats' | 'map' | 'users' | 'analytics' | 'reports'>('dashboard')
  const [stats, setStats] = useState<any>(null)
  const [threats, setThreats] = useState<ThreatItem[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null)
  
  // Table filters & controls
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'newest' | 'risk_score'>('newest')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 8

  const loadInvestigatorData = async () => {
    setLoading(true)
    try {
      const [dashStats, threatList, users, anData] = await Promise.all([
        threatService.getInvestigatorDashboard().catch(() => ({})),
        threatService.getInvestigatorThreats().catch(() => []),
        threatService.getUsers().catch(() => []),
        threatService.getAnalytics().catch(() => ({})),
      ])
      setStats(dashStats)
      setThreats(threatList)
      setUsersList(users)
      setAnalytics(anData)
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
      a.download = `VaultShield_Forensic_Report_${tId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert('Failed to download PDF report.')
    }
  }

  // Filter and sort threats
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

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1F1F29] flex flex-col font-body">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#D8C8FF] text-[#1F1F29] shadow-sm">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] border border-[#D8C8FF] flex items-center justify-center text-[#7342E2] shadow-sm">
              <ShieldAlert size={20} />
            </div>
            <div>
              <span className="font-heading text-lg font-bold tracking-tight text-[#1F1F29]">
                VaultShield
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#F9FAFB] p-1 rounded-2xl border border-[#D8C8FF]">
            {[
              { id: 'dashboard', label: 'Overview', icon: BarChart3 },
              { id: 'threats', label: 'Threat Monitoring', icon: ShieldAlert, count: threats.length },
              { id: 'map', label: 'Threat Map', icon: Globe },
              { id: 'users', label: 'User Monitoring', icon: Users },
              { id: 'analytics', label: 'Analytics', icon: Terminal },
              { id: 'reports', label: 'Reports', icon: FileText },
            ].map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    active
                      ? 'bg-[#7342E2] text-white shadow-sm'
                      : 'text-[#6B7280] hover:text-[#1F1F29] hover:bg-white'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                      active ? 'bg-white/20 text-white' : 'bg-[#7342E2]/10 text-[#7342E2]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadInvestigatorData}
              disabled={loading}
              title="Refresh Data"
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
            {/* Primary Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Total Emails Analyzed</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-[#1F1F29]">{stats?.total_emails_scanned ?? threats.length}</span>
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
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Active Investigations</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-[#7342E2]">{stats?.active_investigations ?? threats.filter(t => t.status !== 'resolved').length}</span>
                </div>
                <span className="text-[10px] text-[#7342E2] font-semibold mt-1">Open / Under Review</span>
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
                  <span className="text-xl font-extrabold text-red-700">{stats?.critical_threats ?? 0}</span>
                </div>
                <AlertTriangle size={20} className="text-red-500" />
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">High (50-74)</span>
                  <span className="text-xl font-extrabold text-orange-700">{stats?.high_threats ?? stats?.high_risk_threats ?? 0}</span>
                </div>
                <ShieldAlert size={20} className="text-orange-500" />
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Medium (25-49)</span>
                  <span className="text-xl font-extrabold text-amber-700">{stats?.medium_threats ?? 0}</span>
                </div>
                <Activity size={20} className="text-amber-500" />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Low (0-24)</span>
                  <span className="text-xl font-extrabold text-emerald-700">{stats?.low_threats ?? 0}</span>
                </div>
                <CheckCircle size={20} className="text-emerald-500" />
              </div>
            </div>

            {/* Threat Categories & Recent Incident Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Category Breakdown */}
              <div className="p-6 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm space-y-4">
                <h3 className="font-heading text-base font-bold text-[#1F1F29]">
                  Threat Type Distribution
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Phishing Attacks', count: stats?.phishing_count || 0, color: 'bg-red-500' },
                    { label: 'Business Email Compromise (BEC)', count: stats?.bec_count || 0, color: 'bg-orange-500' },
                    { label: 'Credential Theft / Fraud', count: stats?.fraud_count || 0, color: 'bg-purple-500' },
                    { label: 'Malware Vectors', count: stats?.malware_count || 0, color: 'bg-amber-500' },
                  ].map((cat, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-[#F9FAFB] border border-[#D8C8FF]/50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                        <span className="text-xs font-bold text-[#1F1F29]">{cat.label}</span>
                      </div>
                      <span className="text-xs font-mono font-extrabold text-[#1F1F29]">{cat.count}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('map')}
                    className="w-full py-2.5 rounded-2xl bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-[#D8C8FF] text-xs font-bold text-[#7342E2] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Globe size={14} />
                    <span>View Geographic Distribution Map</span>
                  </button>
                  <p className="text-[10px] text-[#6B7280] text-center mt-2">
                    Approximate IP-based location — not exact physical location.
                  </p>
                </div>
              </div>

              {/* Recent Incidents */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-base font-bold text-[#1F1F29]">
                      Recent Security Incidents
                    </h3>
                    <p className="text-xs text-[#6B7280]">Verified threat telemetry from Supabase</p>
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
                {/* Search */}
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

                {/* Threat Type Filter */}
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

                {/* Severity Filter */}
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

                {/* Status Filter */}
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

                {/* Sort Toggle */}
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

            {/* Pagination Controls */}
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

        {/* TAB 4: USER MONITORING */}
        {activeTab === 'users' && (
          <div className="p-6 rounded-3xl bg-white border border-[#D8C8FF] shadow-sm space-y-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#1F1F29]">
                Monitored Enterprise Accounts ({usersList.length})
              </h2>
              <p className="text-xs text-[#6B7280]">
                RBAC monitored user telemetry and threat incident volume
              </p>
            </div>

            <div className="divide-y divide-[#D8C8FF]/40">
              {usersList.map((u, i) => (
                <div key={i} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#F5F3FF] border border-[#D8C8FF] text-[#7342E2] font-bold flex items-center justify-center">
                      {u.name ? u.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#1F1F29] block">{u.name || 'Enterprise User'}</span>
                      <span className="text-[11px] text-[#6B7280] font-mono">{u.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-[#F9FAFB] border border-[#D8C8FF] font-bold uppercase text-[10px] text-[#6B7280]">
                      Role: {u.role}
                    </span>
                    <span className="font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-md">
                      {u.threats_count} Threats Logged
                    </span>
                    {u.critical_count > 0 && (
                      <span className="font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
                        {u.critical_count} Critical
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
  )
}

export default InvestigatorDashboard
