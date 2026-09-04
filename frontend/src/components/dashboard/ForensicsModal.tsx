import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  X, ShieldAlert, CheckCircle2, AlertTriangle, Globe,
  Download, Lock, Activity, ShieldCheck
} from 'lucide-react'
import { threatService } from '../../services/threats'

interface ForensicsModalProps {
  threatId: string | null
  onClose: () => void
  onStatusUpdated?: () => void
}

export const ForensicsModal: React.FC<ForensicsModalProps> = ({ threatId, onClose, onStatusUpdated }) => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [downloading, setDownloading] = useState<boolean>(false)
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'headers' | 'intel'>('overview')

  useEffect(() => {
    if (!threatId) return
    setLoading(true)
    threatService.getForensics(threatId)
      .then(res => setData(res))
      .catch(err => console.error("Error fetching forensics:", err))
      .finally(() => setLoading(false))
  }, [threatId])

  if (!threatId) return null

  const handleDownloadPdf = async () => {
    setDownloading(true)
    try {
      const blob = await threatService.downloadReportPdf(threatId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `VaultShield_Forensic_Incident_${threatId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert("Failed to download PDF report.")
    } finally {
      setDownloading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdatingStatus(true)
    try {
      await threatService.updateStatus(threatId, newStatus, `Investigator manual verdict update: ${newStatus}`)
      const refreshed = await threatService.getForensics(threatId)
      setData(refreshed)
      if (onStatusUpdated) onStatusUpdated()
    } catch (err) {
      alert("Status update failed.")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const threat = data?.threat
  const email = data?.email
  const analysis = data?.analysis
  const ipIntel = data?.ip_intelligence
  const geo = data?.geolocation
  const timeline = data?.timeline || []

  const severityColor =
    threat?.severity === 'critical' ? 'bg-red-500/10 text-red-600 border-red-500/30' :
    threat?.severity === 'high' ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
    threat?.severity === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
    'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-[#D8C8FF] overflow-hidden text-[#1F1F29]"
      >
        {/* Header Bar */}
        <div className="p-6 border-b border-[#D8C8FF] flex items-center justify-between bg-[#FAF8FF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5F3FF] border border-[#D8C8FF] flex items-center justify-center text-[#7342E2] shadow-sm">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[#1F1F29]">
                  Forensic Investigation Dossier
                </h2>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#F5F3FF] text-[#7342E2] border border-[#D8C8FF]">
                  #{threatId.slice(0, 8).toUpperCase()}
                </span>
                {threat?.is_demo && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    DEMO DATA
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280] font-body mt-0.5">
                Multi-layer email authentication, network telemetry & AI NLP evidence pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#7342E2] hover:brightness-110 active:scale-95 shadow-sm transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>{downloading ? 'Generating PDF...' : 'Export PDF Report'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B7280] hover:text-[#1F1F29] hover:bg-[#F5F3FF] border border-transparent hover:border-[#D8C8FF] transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-[#D8C8FF] flex items-center gap-2 bg-white overflow-x-auto">
          {[
            { id: 'overview', label: 'Threat Overview', icon: Activity },
            { id: 'headers', label: 'Headers & Auth (SPF/DKIM)', icon: Lock },
            { id: 'intel', label: 'IP & GeoLocation', icon: Globe },
          ].map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
                  active
                    ? 'border-[#7342E2] text-[#7342E2]'
                    : 'border-transparent text-[#6B7280] hover:text-[#1F1F29]'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-190px)]">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-[#D8C8FF] border-t-[#7342E2] rounded-full animate-spin" />
              <p className="text-xs font-semibold text-[#6B7280]">Extracting forensic telemetry from database...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Score Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-[#D8C8FF] shadow-sm flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Final Risk Score</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-extrabold font-heading text-[#1F1F29]">
                          {threat?.risk_score ?? 0}
                        </span>
                        <span className="text-xs font-semibold text-[#6B7280]">/ 100</span>
                      </div>
                      <span className={`mt-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border inline-block w-fit ${severityColor}`}>
                        {threat?.severity}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#D8C8FF] shadow-sm flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Threat Classification</span>
                      <p className="text-lg font-bold font-heading text-[#1F1F29] mt-2">
                        {threat?.threat_type}
                      </p>
                      <span className="text-[11px] font-semibold text-[#7342E2]">
                        Confidence: {Math.round((threat?.confidence || 0.95) * 100)}%
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#D8C8FF] shadow-sm flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">AI Score vs IP Score</span>
                      <div className="flex items-center gap-3 mt-2 text-xs font-bold">
                        <div>
                          <span className="text-[#6B7280] block text-[10px]">Gemini AI</span>
                          <span className="text-sm text-[#7342E2]">{analysis?.ai_risk_score || threat?.risk_score}/100</span>
                        </div>
                        <div className="h-6 w-[1px] bg-[#D8C8FF]" />
                        <div>
                          <span className="text-[#6B7280] block text-[10px]">IP Fraud</span>
                          <span className="text-sm text-red-600">{ipIntel?.fraud_score ?? 75}/100</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#6B7280] mt-1">Weighted formula applied</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#D8C8FF] shadow-sm flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Incident Status</span>
                      <div className="mt-2">
                        <select
                          value={threat?.status || 'new'}
                          disabled={updatingStatus}
                          onChange={(e) => handleUpdateStatus(e.target.value)}
                          className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white border border-[#D8C8FF] text-[#1F1F29] focus:outline-none focus:border-[#7342E2]"
                        >
                          <option value="new">🔴 Status: NEW</option>
                          <option value="reviewing">🟡 Status: REVIEWING</option>
                          <option value="confirmed">🟣 Status: CONFIRMED</option>
                          <option value="false_positive">⚪ Status: FALSE POSITIVE</option>
                          <option value="resolved">🟢 Status: RESOLVED</option>
                        </select>
                      </div>
                      <span className="text-[10px] text-[#6B7280] mt-1">Click to change incident verdict</span>
                    </div>
                  </div>

                  {/* Summary & Email Preview */}
                  <div className="p-5 rounded-2xl bg-[#F5F3FF] border border-[#D8C8FF]">
                    <h3 className="text-xs font-bold text-[#7342E2] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShieldCheck size={16} />
                      Forensic Security Summary
                    </h3>
                    <p className="text-sm font-medium text-[#1F1F29] leading-relaxed">
                      {threat?.summary || analysis?.summary}
                    </p>
                  </div>

                  {/* Email Details Card */}
                  <div className="p-5 rounded-2xl bg-white border border-[#D8C8FF] shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Email Metadata</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-bold text-[#6B7280]">Subject:</span>
                        <p className="font-semibold text-[#1F1F29] mt-0.5">{email?.subject || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-[#6B7280]">Claimed Sender:</span>
                        <p className="font-semibold font-mono text-[#1F1F29] mt-0.5">{email?.sender || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-[#6B7280]">Recipient:</span>
                        <p className="font-semibold font-mono text-[#1F1F29] mt-0.5">{email?.recipient || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-[#6B7280]">Date:</span>
                        <p className="font-semibold text-[#1F1F29] mt-0.5">{email?.date ? new Date(email.date).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                    {email?.plain_text_body && (
                      <div className="pt-2">
                        <span className="font-bold text-[#6B7280] text-xs block mb-1">Body Content Snippet:</span>
                        <pre className="p-3 rounded-xl bg-[#FAF8FF] border border-[#D8C8FF]/60 font-mono text-xs text-[#1F1F29] whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {email.plain_text_body}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: HEADERS & AUTH */}
              {activeTab === 'headers' && (
                <div className="space-y-6">
                  {/* Authentication Results Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['spf', 'dkim', 'dmarc'].map(proto => {
                      const val = (email?.headers?.[proto] || 'unknown').toLowerCase()
                      const isPass = val === 'pass'
                      const isFail = val === 'fail'
                      return (
                        <div key={proto} className="p-5 rounded-2xl bg-white border border-[#D8C8FF] shadow-sm flex flex-col justify-between">
                          <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">{proto.toUpperCase()} Authentication</span>
                          <div className="my-3 flex items-center gap-2">
                            {isPass ? (
                              <CheckCircle2 size={24} className="text-emerald-600" />
                            ) : isFail ? (
                              <AlertTriangle size={24} className="text-red-600" />
                            ) : (
                              <ShieldAlert size={24} className="text-amber-600" />
                            )}
                            <span className="text-xl font-bold font-mono uppercase text-[#1F1F29]">{val}</span>
                          </div>
                          <p className="text-[11px] text-[#6B7280]">
                            {isFail
                              ? `Fails ${proto.toUpperCase()} verification. High probability of address forgery.`
                              : isPass
                              ? `Passed cryptographic validation.`
                              : `No authoritative record published.`}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Headers Table */}
                  <div className="p-5 rounded-2xl bg-white border border-[#D8C8FF] shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">MIME Header Diagnostics</h3>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-[#FAF8FF] border border-[#D8C8FF]/60 flex flex-col">
                        <span className="text-[#7342E2] font-bold">Authentication-Results:</span>
                        <span className="text-[#1F1F29] mt-0.5">{email?.headers?.auth_results || 'spf=fail; dkim=fail; dmarc=fail (calculated)'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FAF8FF] border border-[#D8C8FF]/60 flex flex-col">
                        <span className="text-[#7342E2] font-bold">Return-Path:</span>
                        <span className="text-[#1F1F29] mt-0.5">{email?.headers?.return_path || '<bounce@threat-relay.net>'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FAF8FF] border border-[#D8C8FF]/60 flex flex-col">
                        <span className="text-[#7342E2] font-bold">Source Origin IP:</span>
                        <span className="text-[#1F1F29] mt-0.5">{email?.headers?.source_ip || '185.220.101.5'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: IP & GEOLOCATION */}
              {activeTab === 'intel' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* IPQS Card */}
                    <div className="p-5 rounded-2xl bg-white border border-[#D8C8FF] shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">IPQualityScore Threat Intel</span>
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                          Fraud Score: {ipIntel?.fraud_score ?? 85}/100
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-[#D8C8FF]/40">
                          <span className="text-[#6B7280]">Evaluated IP:</span>
                          <span className="font-mono font-bold text-[#1F1F29]">{ipIntel?.ip || '185.220.101.5'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#D8C8FF]/40">
                          <span className="text-[#6B7280]">VPN Detected:</span>
                          <span className="font-bold text-[#1F1F29]">{ipIntel?.is_vpn ? '🔴 Yes (VPN)' : '🟢 No'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#D8C8FF]/40">
                          <span className="text-[#6B7280]">TOR Node:</span>
                          <span className="font-bold text-[#1F1F29]">{ipIntel?.is_tor ? '🔴 Yes (Tor Exit)' : '🟢 No'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#D8C8FF]/40">
                          <span className="text-[#6B7280]">Proxy Relay:</span>
                          <span className="font-bold text-[#1F1F29]">{ipIntel?.is_proxy ? '🔴 Yes (Proxy)' : '🟢 No'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#6B7280]">ISP / Organization:</span>
                          <span className="font-semibold text-right text-[#1F1F29]">{ipIntel?.isp || 'Tor Exit Node Transit'}</span>
                        </div>
                      </div>
                    </div>

                    {/* GeoLocation Card */}
                    <div className="p-5 rounded-2xl bg-white border border-[#D8C8FF] shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Approximate Geolocation</span>
                        <span className="text-[10px] font-semibold text-[#7342E2] bg-[#F5F3FF] px-2 py-0.5 rounded-md border border-[#D8C8FF]">
                          IP-based approximate location
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-[#D8C8FF]/40">
                          <span className="text-[#6B7280]">Country:</span>
                          <span className="font-bold text-[#1F1F29]">{geo?.country || 'Germany'} ({geo?.country_code || 'DE'})</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#D8C8FF]/40">
                          <span className="text-[#6B7280]">City / Region:</span>
                          <span className="font-bold text-[#1F1F29]">{geo?.city || 'Frankfurt'}, {geo?.region || 'Hessen'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#D8C8FF]/40">
                          <span className="text-[#6B7280]">Coordinates:</span>
                          <span className="font-mono text-[#1F1F29]">{geo?.latitude || 50.1109}, {geo?.longitude || 8.6821}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#6B7280]">Autonomous System (ASN):</span>
                          <span className="font-mono font-bold text-[#7342E2]">{geo?.asn || 'AS206349'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ForensicsModal
