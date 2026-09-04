import React, { useState, useEffect, useMemo } from 'react'
import {
  ShieldAlert, Globe, Users, BarChart3, FileText,
  Sparkles, Download, Eye, RefreshCw,
  Search, Terminal, LogOut, Play, ArrowUpDown, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle, Clock, ShieldCheck, Activity, MapPin
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { threatService, type ThreatItem } from '../../services/threats'
import ForensicsModal from './ForensicsModal'
import ThreatMapView from './ThreatMapView'
import ManualScanModal from './ManualScanModal'

export const InvestigatorDashboard: React.FC = () => {
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'threats' | 'map' | 'users' | 'analytics' | 'reports'>('dashboard')
  const [stats, setStats] = useState<any>(null)
  const [threats, setThreats] = useState<ThreatItem[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null)
  const [scanModalOpen, setScanModalOpen] = useState<boolean>(false)
  const [seedingDemo, setSeedingDemo] = useState<boolean>(false)
  
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

  const handleSeedDemoScenarios = async () => {
    setSeedingDemo(true)
    try {
      await threatService.seedDemoData()
      await loadInvestigatorData()
    } catch (err) {
      alert('Failed to seed demo scenarios.')
    } finally {
      setSeedingDemo(false)
    }
  }

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
    <div className="min-h-screen bg-[#FAF9F6] text-[#192837] flex flex-col font-body">
      {/* Top Security Operations Center Header */}
      <header className="sticky top-0 z-40 w-full bg-[#12101F]/95 backdrop-blur-xl border-b border-[#7342E2]/25 text-white shadow-xl shadow-[#7342E2]/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A78BFA] via-[#8B5CF6] to-[#7342E2] flex items-center justify-center text-white shadow-lg shadow-[#7342E2]/35 border border-white/20">
              <ShieldAlert size={20} />
            </div>
            <div>
              <span className="font-heading text-lg font-bold tracking-tight flex items-center gap-2 text-white">
                VaultShield
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#7342E2] to-[#8B5CF6] text-white tracking-wider uppercase shadow-sm border border-white/15">
                  SOC Tier 2 Investigator
                </span>
              </span>
            </div>
          </div>

          {/* Investigator Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#1E1938]/80 p-1.5 rounded-2xl border border-[#7342E2]/30 shadow-inner">
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
                      ? 'bg-gradient-to-r from-[#7342E2] to-[#8B5CF6] text-white shadow-md shadow-[#7342E2]/30 border border-white/10'
                      : 'text-purple-200/70 hover:text-white hover:bg-[#7342E2]/15'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-extrabold shadow-sm">
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Quick Tools */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadInvestigatorData}
              disabled={loading}
              title="Refresh SOC Data"
              className="w-8 h-8 rounded-full flex items-center justify-center text-purple-200/70 hover:text-white hover:bg-[#7342E2]/20 transition-all cursor-pointer border border-transparent hover:border-[#7342E2]/30"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={handleSeedDemoScenarios}
              disabled={seedingDemo}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#7342E2]/20 text-purple-200 border border-[#7342E2]/40 hover:bg-[#7342E2]/35 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Play size={12} className={seedingDemo ? 'animate-spin' : ''} />
              <span>{seedingDemo ? 'Seeding...' : 'Load Demo Scenarios'}</span>
            </button>

            <button
              type="button"
              onClick={() => setScanModalOpen(true)}
              className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#7342E2] to-[#8B5CF6] hover:brightness-110 active:scale-95 transition-all items-center gap-1.5 shadow-md shadow-[#7342E2]/25 cursor-pointer border border-white/10"
            >
              <Sparkles size={13} />
              <span>Manual Scan</span>
            </button>

            <div className="h-5 w-[1px] bg-[#7342E2]/30" />

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="w-8 h-8 rounded-full flex items-center justify-center text-purple-200/60 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-5 sm:px-8 py-8 flex-1 space-y-8">
        {/* TAB 1: SOC OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Primary SOC Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#192837]/10 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#192837]/60 uppercase tracking-wider">Total Emails Analyzed</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-[#192837]">{stats?.total_emails_scanned ?? threats.length}</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1">Ingestion Pipeline Active</span>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#192837]/10 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#192837]/60 uppercase tracking-wider">Total Threats</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-orange-600">{stats?.total_threats ?? threats.length}</span>
                </div>
                <span className="text-[10px] text-orange-600 font-semibold mt-1">Classified via Gemini AI</span>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#192837]/10 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#192837]/60 uppercase tracking-wider">Critical Threats</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-red-600">{stats?.critical_threats ?? threats.filter(t => t.severity === 'critical').length}</span>
                </div>
                <span className="text-[10px] text-red-600 font-semibold mt-1">Immediate SOC Alert</span>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#192837]/10 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#192837]/60 uppercase tracking-wider">Active Investigations</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-[#7342E2]">{stats?.active_investigations ?? threats.filter(t => t.status !== 'resolved').length}</span>
                </div>
                <span className="text-[10px] text-[#7342E2] font-semibold mt-1">Open / Under Review</span>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#192837]/10 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-[#192837]/60 uppercase tracking-wider">Suspicious IPs</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-amber-600">{stats?.suspicious_ip_count ?? 4}</span>
                </div>
                <span className="text-[10px] text-amber-600 font-semibold mt-1">IPQualityScore Validated</span>
              </div>
            </div>

            {/* Severity Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Critical (75-100)</span>
                  <span className="text-xl font-extrabold text-red-700">{stats?.critical_threats ?? 0}</span>
                </div>
                <AlertTriangle size={20} className="text-red-500" />
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">High (50-74)</span>
                  <span className="text-xl font-extrabold text-orange-700">{stats?.high_threats ?? stats?.high_risk_threats ?? 0}</span>
                </div>
                <ShieldAlert size={20} className="text-orange-500" />
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Medium (25-49)</span>
                  <span className="text-xl font-extrabold text-amber-700">{stats?.medium_threats ?? 0}</span>
                </div>
                <Activity size={20} className="text-amber-500" />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
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
              <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
                <h3 className="font-heading text-base font-bold text-[#192837]">
                  Threat Type Distribution
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Phishing Attacks', count: stats?.phishing_count || 0, color: 'bg-red-500' },
                    { label: 'Business Email Compromise (BEC)', count: stats?.bec_count || 0, color: 'bg-orange-500' },
                    { label: 'Credential Theft / Fraud', count: stats?.fraud_count || 0, color: 'bg-purple-500' },
                    { label: 'Malware Vectors', count: stats?.malware_count || 0, color: 'bg-amber-500' },
                  ].map((cat, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#192837]/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                        <span className="text-xs font-bold text-[#192837]">{cat.label}</span>
                      </div>
                      <span className="text-xs font-mono font-extrabold text-[#192837]">{cat.count}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('map')}
                    className="w-full py-2.5 rounded-2xl bg-[#7342E2]/10 hover:bg-[#7342E2]/20 text-xs font-bold text-[#7342E2] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Globe size={14} />
                    <span>View Geographic Distribution Map</span>
                  </button>
                  <p className="text-[10px] text-[#192837]/40 text-center mt-2">
                    Approximate IP-based location — not exact physical location.
                  </p>
                </div>
              </div>

              {/* Master Incident Log */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-base font-bold text-[#192837]">
                      Recent Security Incidents
                    </h3>
                    <p className="text-xs text-[#192837]/60">Verified threat telemetry from Supabase</p>
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
                  <div className="py-12 text-center text-xs text-[#192837]/60">
                    No threats detected yet. Use "Load Demo Scenarios" or run a manual email scan.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {threats.slice(0, 5).map(t => {
                      const sevColor =
                        t.severity === 'critical' ? 'bg-red-500/10 text-red-600 border-red-500/30' :
                        t.severity === 'high' ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
                        t.severity === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                        'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'

                      return (
                        <div
                          key={t.id}
                          className="p-4 rounded-2xl bg-[#FAF9F6] hover:bg-white border border-[#192837]/5 hover:border-[#7342E2]/30 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${sevColor}`}>
                                {t.severity}
                              </span>
                              <span className="font-heading text-sm font-bold text-[#192837]">
                                {t.threat_type}
                              </span>
                              <span className="text-[10px] font-mono text-[#192837]/40">
                                #{t.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                Risk {t.risk_score}/100
                              </span>
                            </div>
                            <p className="text-xs text-[#192837]/70 line-clamp-1 font-body">
                              {t.summary}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setSelectedThreatId(t.id)}
                              className="px-3 py-1.5 rounded-xl bg-white border border-[#192837]/15 text-xs font-bold text-[#192837] hover:border-[#7342E2] hover:text-[#7342E2] transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={13} />
                              <span>Forensics</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadPdfReport(t.id)}
                              title="Download PDF Dossier"
                              className="w-8 h-8 rounded-xl bg-[#7342E2]/10 hover:bg-[#7342E2] hover:text-white text-[#7342E2] transition-all flex items-center justify-center cursor-pointer"
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

        {/* TAB 2: THREAT MONITORING TABLE WITH FULL SOC CONTROLS */}
        {activeTab === 'threats' && (
          <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-[#192837]">
                  Investigator Threat Monitoring
                </h2>
                <p className="text-xs text-[#192837]/60">
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
                    className="w-full text-xs px-3.5 py-2 pl-9 rounded-xl bg-[#FAF9F6] border border-[#192837]/15 focus:outline-none focus:bg-white focus:border-[#7342E2]"
                  />
                  <Search size={14} className="absolute left-3 top-2.5 text-[#192837]/40" />
                </div>

                {/* Threat Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#192837]/15 focus:outline-none focus:border-[#7342E2]"
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
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#192837]/15 focus:outline-none focus:border-[#7342E2]"
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
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#192837]/15 focus:outline-none focus:border-[#7342E2]"
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
                  className="px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#192837]/15 text-xs font-bold flex items-center gap-1 hover:border-[#7342E2] cursor-pointer"
                >
                  <ArrowUpDown size={12} />
                  <span>{sortBy === 'newest' ? 'Sort: Newest' : 'Sort: Risk Score'}</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#192837]/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] text-[#192837]/70 font-bold uppercase tracking-wider border-b border-[#192837]/10">
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
                <tbody className="divide-y divide-[#192837]/5 bg-white">
                  {paginatedThreats.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#192837]/50 font-medium">
                        No threat incidents matching your current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedThreats.map(t => {
                      const sevColor =
                        t.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        t.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        t.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'

                      return (
                        <tr key={t.id} className="hover:bg-[#FAF9F6]/80 transition-all">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#7342E2]">
                            #{t.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#192837] block">{t.threat_type}</span>
                            <span className="text-[11px] text-[#192837]/60 line-clamp-1 max-w-xs">{t.summary}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-md font-extrabold uppercase text-[10px] ${sevColor}`}>
                              {t.severity}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-red-600">
                            {t.risk_score} / 100
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#192837]/70">
                            {Math.round((t.confidence || 0.95) * 100)}%
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#192837]/60 whitespace-nowrap">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedThreatId(t.id)}
                                className="px-3 py-1.5 rounded-xl bg-white border border-[#192837]/15 font-bold text-xs text-[#192837] hover:border-[#7342E2] hover:text-[#7342E2] transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Eye size={12} />
                                <span>Forensics</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadPdfReport(t.id)}
                                title="Download PDF Report"
                                className="w-7 h-7 rounded-xl bg-[#7342E2]/10 hover:bg-[#7342E2] hover:text-white text-[#7342E2] transition-all flex items-center justify-center cursor-pointer"
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
                <span className="text-xs text-[#192837]/60">
                  Showing Page {currentPage} of {totalPages} ({filteredAndSortedThreats.length} incidents)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-2 rounded-xl bg-[#FAF9F6] border border-[#192837]/10 disabled:opacity-40 hover:bg-white cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-2 rounded-xl bg-[#FAF9F6] border border-[#192837]/10 disabled:opacity-40 hover:bg-white cursor-pointer"
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
          <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#192837]">
                Monitored Enterprise Accounts ({usersList.length})
              </h2>
              <p className="text-xs text-[#192837]/60">
                RBAC monitored user telemetry and threat incident volume
              </p>
            </div>

            <div className="divide-y divide-[#192837]/5">
              {usersList.map((u, i) => (
                <div key={i} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#7342E2]/10 text-[#7342E2] font-bold flex items-center justify-center">
                      {u.name ? u.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#192837] block">{u.name || 'Enterprise User'}</span>
                      <span className="text-[11px] text-[#192837]/60 font-mono">{u.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF9F6] border border-[#192837]/10 font-bold uppercase text-[10px]">
                      Role: {u.role}
                    </span>
                    <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                      {u.threats_count} Threats Logged
                    </span>
                    {u.critical_count > 0 && (
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
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
              <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
                <h3 className="font-heading text-base font-bold text-[#192837]">Threat Vector Distribution</h3>
                <div className="space-y-3">
                  {(analytics?.threat_distribution || []).map((item: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{item.name}</span>
                        <span>{item.percentage}% ({item.count || 0})</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#FAF9F6] overflow-hidden">
                        <div className="h-full bg-[#7342E2]" style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geo Sources */}
              <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
                <h3 className="font-heading text-base font-bold text-[#192837]">Origin Geographic Sources</h3>
                <p className="text-[11px] text-[#192837]/50">
                  Approximate IP-based location — not exact physical location.
                </p>
                <div className="space-y-3">
                  {(analytics?.geographic_distribution || []).map((geo: any, i: number) => (
                    <div key={i} className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#192837]/5 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#7342E2]" />
                        <span className="font-bold">{geo.country} ({geo.code})</span>
                      </div>
                      <span className="font-mono font-bold text-red-600">{geo.threats} Detected</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: REPORTS */}
        {activeTab === 'reports' && (
          <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
            <h2 className="font-heading text-lg font-bold text-[#192837]">
              Generated Forensic Incident Dossiers ({threats.length})
            </h2>
            <p className="text-xs text-[#192837]/60">
              Download court-admissible and SOC compliance level 2 PDF forensic dossiers
            </p>
            <div className="space-y-3 pt-2">
              {threats.map(t => (
                <div key={t.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-[#7342E2]" />
                    <div>
                      <span className="font-bold text-xs text-[#192837] block">
                        Forensic Dossier: {t.threat_type} (Incident #{t.id.slice(0, 8).toUpperCase()})
                      </span>
                      <span className="text-[11px] text-[#192837]/50">
                        Generated by VaultShield SOC Engine • Risk Score: {t.risk_score}/100 • Status: {t.status.toUpperCase()}
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

      {/* Manual Scan Modal */}
      <ManualScanModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onScanCompleted={loadInvestigatorData}
      />

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

