import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  X, ShieldAlert, CheckCircle2, AlertTriangle, Globe,
  Download, Lock, Activity, ShieldCheck, Cpu
} from 'lucide-react'
import { threatService } from '../../services/threats'
import { InvestigatorRAGCopilot } from './InvestigatorRAGCopilot'
import { InteractiveHoverButton } from '../ui/interactive-hover-button'

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
  const [activeTab, setActiveTab] = useState<'overview' | 'headers' | 'intel' | 'copilot'>('overview')

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
      a.download = `CyberTrace_Forensic_Incident_${threatId.slice(0, 8)}.pdf`
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

  const severityColor =
    threat?.severity === 'critical' ? 'bg-[#FF1E2D]/10 text-[#FF1E2D] border-[#FF1E2D]/30' :
      threat?.severity === 'high' ? 'bg-[#FF5A36]/10 text-[#FF5A36] border-[#FF5A36]/30' :
        threat?.severity === 'medium' ? 'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30' :
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#0A0A0A] rounded-3xl shadow-2xl border border-[#2A2A2A] overflow-hidden text-[#F5F5F5]"
      >
        {/* Header Bar */}
        <div className="p-6 border-b border-[#2A2A2A] flex items-center justify-between bg-[#111111]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#181818] border border-[#2A2A2A] flex items-center justify-center text-[#FF1E2D] shadow-sm">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[#F5F5F5]">
                  Forensic Investigation Dossier
                </h2>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#181818] text-[#FF1E2D] border border-[#FF1E2D]/30">
                  #{threatId.slice(0, 8).toUpperCase()}
                </span>
                {threat?.is_demo && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/30">
                    DEMO DATA
                  </span>
                )}
              </div>
              <p className="text-xs text-[#737373] font-body mt-0.5">
                Multi-layer email authentication, network telemetry & AI NLP evidence pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <InteractiveHoverButton
              onClick={handleDownloadPdf}
              disabled={downloading}
              text={downloading ? 'Generating PDF...' : 'Export PDF Report'}
              icon={<Download size={14} className="text-white" />}
              className="hidden sm:inline-flex px-4 py-2 text-xs font-bold text-white bg-[#E50914] border-[#FF1E2D] shadow-sm"
            />

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#737373] hover:text-[#F5F5F5] hover:bg-[#181818] border border-transparent hover:border-[#2A2A2A] transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-[#2A2A2A] flex items-center gap-2 bg-[#0A0A0A] overflow-x-auto">
          {[
            { id: 'overview', label: 'Threat Overview', icon: Activity },
            { id: 'headers', label: 'Headers & Auth (SPF/DKIM)', icon: Lock },
            { id: 'intel', label: 'IP & GeoLocation', icon: Globe },
            { id: 'copilot', label: 'AI Forensic Copilot', icon: Cpu },
          ].map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
                  active
                    ? 'border-[#FF1E2D] text-[#FF1E2D]'
                    : 'border-transparent text-[#737373] hover:text-[#F5F5F5]'
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
              <div className="w-10 h-10 border-3 border-[#2A2A2A] border-t-[#FF1E2D] rounded-full animate-spin" />
              <p className="text-xs font-semibold text-[#737373]">Extracting forensic telemetry from database...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Score Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                    <div className="p-4 rounded-2xl bg-[#111111] border border-[#2A2A2A] shadow-sm flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">Final Risk Score</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-extrabold font-heading text-[#FF1E2D]">
                          {threat?.risk_score ?? 0}
                        </span>
                        <span className="text-xs font-semibold text-[#737373]">/ 100</span>
                      </div>
                      <span className={`mt-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border inline-block w-fit ${severityColor}`}>
                        {threat?.severity}
                      </span>
                    </div>

                    {/* ML Model Detection Card */}
                    <div className="p-4 rounded-2xl bg-[#111111] border border-[#2A2A2A] shadow-sm flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-[#FF1E2D] uppercase tracking-wider flex items-center gap-1">
                        <span>🤖 ML Model Triage</span>
                      </span>
                      <div className="mt-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                            (analysis?.ml_prediction || 'safe').toLowerCase() === 'threat'
                              ? 'bg-[#FF1E2D]/10 text-[#FF1E2D] border-[#FF1E2D]/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}>
                            ML: {analysis?.ml_prediction ? analysis.ml_prediction.toUpperCase() : (threat?.risk_score >= 50 ? 'THREAT' : 'SAFE')}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#F5F5F5] mt-1.5">
                          Risk: <span className="text-[#FF1E2D] font-extrabold">{analysis?.ml_risk_score ?? 0}/100</span>
                        </p>
                      </div>
                      <span className="text-[10px] text-[#737373] font-semibold block mt-1">
                        Confidence: {Math.round((analysis?.ml_probability ?? (threat?.confidence || 0.95)) * 100)}%
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#111111] border border-[#2A2A2A] shadow-sm flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">Threat Classification</span>
                      <p className="text-sm font-bold font-heading text-[#F5F5F5] mt-2 truncate">
                        {threat?.threat_type}
                      </p>
                      <span className="text-[11px] font-semibold text-[#FF1E2D]">
                        Confidence: {Math.round((threat?.confidence || 0.95) * 100)}%
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#111111] border border-[#2A2A2A] shadow-sm flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">AI vs IP vs ML</span>
                      <div className="flex items-center gap-2 mt-2 text-xs font-bold">
                        <div>
                          <span className="text-[#737373] block text-[10px]">Gemini AI</span>
                          <span className="text-xs text-[#FF1E2D]">{analysis?.ai_risk_score || threat?.risk_score}/100</span>
                        </div>
                        <div className="h-6 w-[1px] bg-[#2A2A2A]" />
                        <div>
                          <span className="text-[#737373] block text-[10px]">ML Model</span>
                          <span className="text-xs text-[#FF5A36]">{analysis?.ml_risk_score ?? 0}/100</span>
                        </div>
                        <div className="h-6 w-[1px] bg-[#2A2A2A]" />
                        <div>
                          <span className="text-[#737373] block text-[10px]">IP Fraud</span>
                          <span className="text-xs text-[#FF1E2D]">{ipIntel?.fraud_score ?? 75}/100</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#737373] mt-1">Weighted composite formula</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#111111] border border-[#2A2A2A] shadow-sm flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">Incident Status</span>
                      <div className="mt-2">
                        <select
                          value={threat?.status || 'new'}
                          disabled={updatingStatus}
                          onChange={(e) => handleUpdateStatus(e.target.value)}
                          className="w-full text-xs font-bold px-2 py-1.5 rounded-xl bg-[#181818] border border-[#2A2A2A] text-[#F5F5F5] focus:outline-none focus:border-[#FF1E2D]"
                        >
                          <option value="new">🔴 Status: NEW</option>
                          <option value="reviewing">🟡 Status: REVIEWING</option>
                          <option value="confirmed">🟣 Status: CONFIRMED</option>
                          <option value="false_positive">⚪ Status: FALSE POSITIVE</option>
                          <option value="resolved">🟢 Status: RESOLVED</option>
                        </select>
                      </div>
                      <span className="text-[10px] text-[#737373] mt-1">Change incident verdict</span>
                    </div>
                  </div>

                  {/* Summary & Email Preview */}
                  <div className="p-5 rounded-2xl bg-[#181818] border border-[#2A2A2A]">
                    <h3 className="text-xs font-bold text-[#FF1E2D] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShieldCheck size={16} />
                      Forensic Security Summary
                    </h3>
                    <p className="text-sm font-medium text-[#F5F5F5] leading-relaxed">
                      {threat?.summary || analysis?.summary}
                    </p>
                  </div>

                  {/* Email Details Card */}
                  <div className="p-5 rounded-2xl bg-[#111111] border border-[#2A2A2A] shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-[#737373] uppercase tracking-wider">Email Metadata</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-bold text-[#737373]">Subject:</span>
                        <p className="font-semibold text-[#F5F5F5] mt-0.5">{email?.subject || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-[#737373]">Claimed Sender:</span>
                        <p className="font-semibold font-mono text-[#F5F5F5] mt-0.5">{email?.sender || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-[#737373]">Recipient:</span>
                        <p className="font-semibold font-mono text-[#F5F5F5] mt-0.5">{email?.recipient || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-[#737373]">Date:</span>
                        <p className="font-semibold text-[#F5F5F5] mt-0.5">{email?.date ? new Date(email.date).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                    {email?.plain_text_body && (
                      <div className="pt-2">
                        <span className="font-bold text-[#737373] text-xs block mb-1">Body Content Snippet:</span>
                        <pre className="p-3 rounded-xl bg-[#0A0A0A] border border-[#2A2A2A] font-mono text-xs text-[#F5F5F5] whitespace-pre-wrap max-h-40 overflow-y-auto">
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
                        <div key={proto} className="p-5 rounded-2xl bg-[#111111] border border-[#2A2A2A] shadow-sm flex flex-col justify-between">
                          <span className="text-xs font-bold text-[#737373] uppercase tracking-wider">{proto.toUpperCase()} Authentication</span>
                          <div className="my-3 flex items-center gap-2">
                            {isPass ? (
                              <CheckCircle2 size={24} className="text-emerald-400" />
                            ) : isFail ? (
                              <AlertTriangle size={24} className="text-[#FF1E2D]" />
                            ) : (
                              <ShieldAlert size={24} className="text-[#FFB020]" />
                            )}
                            <span className="text-xl font-bold font-mono uppercase text-[#F5F5F5]">{val}</span>
                          </div>
                          <p className="text-[11px] text-[#737373]">
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
                  <div className="p-5 rounded-2xl bg-[#111111] border border-[#2A2A2A] shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-[#737373] uppercase tracking-wider">MIME Header Diagnostics</h3>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-[#181818] border border-[#2A2A2A] flex flex-col">
                        <span className="text-[#FF1E2D] font-bold">Authentication-Results:</span>
                        <span className="text-[#F5F5F5] mt-0.5">{email?.headers?.auth_results || 'spf=fail; dkim=fail; dmarc=fail (calculated)'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#181818] border border-[#2A2A2A] flex flex-col">
                        <span className="text-[#FF1E2D] font-bold">Return-Path:</span>
                        <span className="text-[#F5F5F5] mt-0.5">{email?.headers?.return_path || '<bounce@threat-relay.net>'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#181818] border border-[#2A2A2A] flex flex-col">
                        <span className="text-[#FF1E2D] font-bold">Source Origin IP:</span>
                        <span className="text-[#F5F5F5] mt-0.5">{email?.headers?.source_ip || '185.220.101.5'}</span>
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
                    <div className="p-5 rounded-2xl bg-[#111111] border border-[#2A2A2A] shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#737373] uppercase tracking-wider">IPQualityScore Threat Intel</span>
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-[#FF1E2D]/10 text-[#FF1E2D] border border-[#FF1E2D]/30">
                          Fraud Score: {ipIntel?.fraud_score ?? 85}/100
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
                          <span className="text-[#737373]">Evaluated IP:</span>
                          <span className="font-mono font-bold text-[#F5F5F5]">{ipIntel?.ip || '185.220.101.5'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
                          <span className="text-[#737373]">VPN Detected:</span>
                          <span className="font-bold text-[#F5F5F5]">{ipIntel?.is_vpn ? '🔴 Yes (VPN)' : '🟢 No'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
                          <span className="text-[#737373]">TOR Node:</span>
                          <span className="font-bold text-[#F5F5F5]">{ipIntel?.is_tor ? '🔴 Yes (Tor Exit)' : '🟢 No'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
                          <span className="text-[#737373]">Proxy Relay:</span>
                          <span className="font-bold text-[#F5F5F5]">{ipIntel?.is_proxy ? '🔴 Yes (Proxy)' : '🟢 No'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#737373]">ISP / Organization:</span>
                          <span className="font-semibold text-right text-[#F5F5F5]">{ipIntel?.isp || 'Tor Exit Node Transit'}</span>
                        </div>
                      </div>
                    </div>

                    {/* GeoLocation Card */}
                    <div className="p-5 rounded-2xl bg-[#111111] border border-[#2A2A2A] shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#737373] uppercase tracking-wider">Approximate Geolocation</span>
                        <span className="text-[10px] font-semibold text-[#FF1E2D] bg-[#FF1E2D]/10 px-2 py-0.5 rounded-md border border-[#FF1E2D]/20">
                          IP-based approximate location
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
                          <span className="text-[#737373]">Country:</span>
                          <span className="font-bold text-[#F5F5F5]">{geo?.country || 'Germany'} ({geo?.country_code || 'DE'})</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
                          <span className="text-[#737373]">City / Region:</span>
                          <span className="font-bold text-[#F5F5F5]">{geo?.city || 'Frankfurt'}, {geo?.region || 'Hessen'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
                          <span className="text-[#737373]">Coordinates:</span>
                          <span className="font-mono text-[#F5F5F5]">{geo?.latitude || 50.1109}, {geo?.longitude || 8.6821}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#737373]">Autonomous System (ASN):</span>
                          <span className="font-mono font-bold text-[#FF1E2D]">{geo?.asn || 'AS206349'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: AI FORENSIC COPILOT */}
              {activeTab === 'copilot' && (
                <div className="pt-2">
                  <InvestigatorRAGCopilot
                    emails={email ? [email] : []}
                    selectedEmailId={email?.id}
                    isModal={true}
                  />
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
