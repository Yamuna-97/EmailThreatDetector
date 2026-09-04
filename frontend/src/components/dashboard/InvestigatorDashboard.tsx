import React, { useState, useEffect } from 'react'
import {
  ShieldAlert, Globe, Users, BarChart3, FileText,
  Sparkles, Download, Eye, RefreshCw,
  Search, Terminal, LogOut, Play
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
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

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

  const filteredThreats = threats.filter(t => {
    if (severityFilter && t.severity.toLowerCase() !== severityFilter.toLowerCase()) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!t.threat_type.toLowerCase().includes(q) && !t.summary.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#192837] flex flex-col font-body">
      {/* Top Security Operations Center Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#192837] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#7342E2] flex items-center justify-center text-white shadow-md shadow-[#7342E2]/30">
              <ShieldAlert size={20} />
            </div>
            <div>
              <span className="font-heading text-lg font-bold tracking-tight flex items-center gap-2">
                VaultShield
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#7342E2] text-white tracking-wider uppercase">
                  SOC Tier 2 Investigator
                </span>
              </span>
            </div>
          </div>

          {/* Investigator Console Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
            {[
              { id: 'dashboard', label: 'Overview', icon: BarChart3 },
              { id: 'threats', label: 'Incidents', icon: ShieldAlert, count: threats.length },
              { id: 'map', label: 'Threat Map', icon: Globe },
              { id: 'users', label: 'Monitored Users', icon: Users },
              { id: 'analytics', label: 'Analytics', icon: Terminal },
              { id: 'reports', label: 'Reports', icon: FileText },
            ].map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    active
                      ? 'bg-[#7342E2] text-white shadow-md'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-extrabold">
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Quick Tools & Session */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadInvestigatorData}
              disabled={loading}
              title="Refresh SOC Data"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={handleSeedDemoScenarios}
              disabled={seedingDemo}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Play size={12} className={seedingDemo ? 'animate-spin' : ''} />
              <span>{seedingDemo ? 'Seeding...' : 'Load SIH Demo Scenarios'}</span>
            </button>

            <button
              type="button"
              onClick={() => setScanModalOpen(true)}
              className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#7342E2] hover:brightness-110 active:scale-95 transition-all items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Manual Scan</span>
            </button>

            <div className="h-5 w-[1px] bg-white/20" />

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-white/10 transition-all cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-5 sm:px-8 py-8 flex-1 space-y-8">
        {/* TAB 1: SOC OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-[#192837]/10 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#192837]/60 uppercase tracking-wider">Total Emails Ingested</span>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl font-extrabold font-heading text-[#192837]">{stats?.total_emails_scanned ?? threats.length}</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1">Multi-tenant pipeline</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#192837]/10 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#192837]/60 uppercase tracking-wider">Identified Threats</span>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl font-extrabold font-heading text-orange-600">{stats?.total_threats ?? threats.length}</span>
                </div>
                <span className="text-[10px] text-orange-600 font-semibold mt-1">Classified via Gemini AI</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#192837]/10 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#192837]/60 uppercase tracking-wider">Critical Incidents</span>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl font-extrabold font-heading text-red-600">{stats?.critical_threats ?? threats.filter(t => t.severity === 'critical').length}</span>
                </div>
                <span className="text-[10px] text-red-600 font-semibold mt-1">Immediate action required</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#192837]/10 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#192837]/60 uppercase tracking-wider">Monitored Accounts</span>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl font-extrabold font-heading text-[#7342E2]">{stats?.total_users ?? Math.max(usersList.length, 1)}</span>
                </div>
                <span className="text-[10px] text-[#7342E2] font-semibold mt-1">Protected inboxes</span>
              </div>
            </div>

            {/* Threat Categories Breakdown & Threat Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Category Breakdown */}
              <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
                <h3 className="font-heading text-base font-bold text-[#192837]">
                  Threat Vectors Classified
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Phishing Attacks', count: stats?.phishing_count || 3, color: 'bg-red-500' },
                    { label: 'Business Email Compromise (BEC)', count: stats?.bec_count || 1, color: 'bg-orange-500' },
                    { label: 'Credential Harvesting', count: stats?.fraud_count || 2, color: 'bg-purple-500' },
                    { label: 'Suspicious IP Reputations', count: stats?.suspicious_ip_count || 4, color: 'bg-amber-500' },
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

                <button
                  type="button"
                  onClick={() => setActiveTab('map')}
                  className="w-full py-2.5 rounded-2xl bg-[#7342E2]/10 hover:bg-[#7342E2]/20 text-xs font-bold text-[#7342E2] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Globe size={14} />
                  <span>Inspect Threat Map</span>
                </button>
              </div>

              {/* Master Incident Log */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-base font-bold text-[#192837]">
                    Master Incident Registry
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('threats')}
                    className="text-xs font-bold text-[#7342E2] hover:underline cursor-pointer"
                  >
                    View Filterable Log →
                  </button>
                </div>

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
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INCIDENTS & THREATS WITH FILTERS */}
        {activeTab === 'threats' && (
          <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-[#192837]">
                  Incident Registry & Forensic Investigation
                </h2>
                <p className="text-xs text-[#192837]/60">Filter, inspect evidence dossiers, or export PDF reports</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search incidents, sender, type..."
                    className="w-full text-xs px-3.5 py-2 pl-9 rounded-xl bg-[#FAF9F6] border border-[#192837]/15 focus:outline-none focus:bg-white focus:border-[#7342E2]"
                  />
                  <Search size={14} className="absolute left-3 top-2.5 text-[#192837]/40" />
                </div>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#192837]/15 focus:outline-none focus:border-[#7342E2]"
                >
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredThreats.map(t => (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-[#FAF9F6] hover:bg-white border border-[#192837]/10 hover:border-[#7342E2]/30 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-red-100 text-red-700">
                        Risk: {t.risk_score}/100
                      </span>
                      <span className="font-heading text-base font-bold text-[#192837]">
                        {t.threat_type}
                      </span>
                      <span className="text-[11px] font-mono text-[#192837]/40">
                        #{t.id.slice(0, 8).toUpperCase()}
                      </span>
                      {t.is_demo && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          DEMO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#192837]/80 line-clamp-2 max-w-3xl">
                      {t.summary}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-[#192837]/50 pt-1">
                      <span>Status: <b className="uppercase text-[#7342E2]">{t.status}</b></span>
                      <span>Confidence: <b>{Math.round((t.confidence || 0.95) * 100)}%</b></span>
                      <span>Date: <b>{new Date(t.created_at).toLocaleDateString()}</b></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedThreatId(t.id)}
                      className="px-4 py-2 rounded-xl bg-white border border-[#192837]/15 text-xs font-bold text-[#192837] hover:border-[#7342E2] hover:text-[#7342E2] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>Deep Forensics</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdfReport(t.id)}
                      className="px-3.5 py-2 rounded-xl bg-[#7342E2] text-white text-xs font-bold hover:brightness-110 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: THREAT MAP */}
        {activeTab === 'map' && <ThreatMapView />}

        {/* TAB 4: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
            <h2 className="font-heading text-lg font-bold text-[#192837]">
              Monitored Enterprise Accounts ({usersList.length})
            </h2>
            <div className="divide-y divide-[#192837]/5">
              {usersList.map((u, i) => (
                <div key={i} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#7342E2]/10 text-[#7342E2] font-bold flex items-center justify-center">
                      {u.name ? u.name[0] : 'U'}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#192837] block">{u.name}</span>
                      <span className="text-[11px] text-[#192837]/60 font-mono">{u.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF9F6] border border-[#192837]/10 font-bold uppercase text-[10px]">
                      Role: {u.role}
                    </span>
                    <span className="font-bold text-orange-600">
                      {u.threats_count} Threats Logged
                    </span>
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
              <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
                <h3 className="font-heading text-base font-bold text-[#192837]">Threat Vector Distribution</h3>
                <div className="space-y-2.5">
                  {(analytics?.threat_distribution || [
                    { name: 'Phishing', percentage: 45 },
                    { name: 'Business Email Compromise', percentage: 25 },
                    { name: 'Credential Theft', percentage: 20 },
                    { name: 'Malware Vector', percentage: 10 }
                  ]).map((item: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{item.name}</span>
                        <span>{item.percentage}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#FAF9F6] overflow-hidden">
                        <div className="h-full bg-[#7342E2]" style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
                <h3 className="font-heading text-base font-bold text-[#192837]">Origin Geographic Sources</h3>
                <div className="space-y-3">
                  {(analytics?.geographic_distribution || [
                    { country: 'Germany', code: 'DE', threats: 5 },
                    { country: 'Russia', code: 'RU', threats: 4 },
                    { country: 'United States', code: 'US', threats: 3 },
                    { country: 'India', code: 'IN', threats: 1 }
                  ]).map((geo: any, i: number) => (
                    <div key={i} className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#192837]/5 flex justify-between items-center text-xs">
                      <span className="font-bold">{geo.country} ({geo.code})</span>
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
              Generated Forensic Incident Dossiers
            </h2>
            <div className="space-y-3">
              {threats.map(t => (
                <div key={t.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-[#7342E2]" />
                    <div>
                      <span className="font-bold text-xs text-[#192837] block">
                        Forensic Dossier: {t.threat_type} (Incident #{t.id.slice(0, 8).toUpperCase()})
                      </span>
                      <span className="text-[11px] text-[#192837]/50">
                        Generated by VaultShield SOC Engine • PDF Compliance Level 2
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
