import React, { useState, useMemo } from 'react'
import {
  Terminal,
  ShieldAlert,
  Cpu,
  Send,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  Zap,
  BookOpen,
  User,
  Mail
} from 'lucide-react'
import { ragApi, type RAGQueryResponse } from '../../services/ragApi'

interface InvestigatorRAGCopilotProps {
  emails?: any[]
  users?: any[]
  selectedEmailId?: string
  onClose?: () => void
  isModal?: boolean
}

export const InvestigatorRAGCopilot: React.FC<InvestigatorRAGCopilotProps> = ({
  emails = [],
  users = [],
  selectedEmailId: initialEmailId,
  onClose,
  isModal = false,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedEmailId, setSelectedEmailId] = useState<string>(initialEmailId || '')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [response, setResponse] = useState<RAGQueryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedSources, setExpandedSources] = useState(false)

  // Filter emails by selected user if a user is chosen
  const filteredEmails = useMemo(() => {
    if (!selectedUserId) return emails
    return emails.filter(e => e.user_id === selectedUserId)
  }, [emails, selectedUserId])

  const forensicPrompts = [
    {
      title: 'RFC Auth & Header Alignment Forensics',
      prompt: 'Perform deep RFC 7208 (SPF), RFC 6376 (DKIM), and RFC 7489 (DMARC) alignment forensic analysis on this email. Identify exact header spoofing and domain misalignment vectors.',
      needsEmail: true,
    },
    {
      title: 'MITRE ATT&CK Matrix Correlation',
      prompt: 'Map the observed threat indicators, social engineering vectors, and URLs in this email to official MITRE ATT&CK Enterprise Matrix techniques (e.g. T1566.001, T1566.002, T1598, T1078).',
      needsEmail: true,
    },
    {
      title: 'CISA/NIST Incident Containment Plan',
      prompt: 'Generate an actionable Incident Response Containment, Eradication, and Remediation playbook following NIST SP 800-150 and CISA Federal Cybersecurity Incident guidelines for this threat.',
      needsEmail: true,
    },
    {
      title: 'IP, ASN & Geo Threat Correlation',
      prompt: 'Correlate the originating IP address, ASN telemetry, geolocation, and IPQualityScore fraud metrics to determine adversary infrastructure profile and proxy/VPN tunneling indicators.',
      needsEmail: true,
    },
    {
      title: 'IOC Extraction & Firewall Rules',
      prompt: 'Extract all actionable Indicators of Compromise (IOCs)—including sender domains, malicious URLs, source IPs, and hashes—and format them into SIEM/Firewall block rules.',
      needsEmail: true,
    },
    {
      title: 'BEC & Wire Fraud Forensic Analysis',
      prompt: 'How do advanced Business Email Compromise (BEC) actors manipulate Received headers, display names, and reply-to headers to execute executive impersonation?',
      needsEmail: false,
    },
  ]

  const handleSend = async (customQuery?: string) => {
    const q = (customQuery || query).trim()
    if (!q) return

    setLoading(true)
    setError(null)
    if (customQuery) setQuery(customQuery)

    try {
      const res = await ragApi.queryInvestigatorRAG(q, selectedEmailId || undefined)
      setResponse(res)
    } catch (err: any) {
      setError(err.message || 'Forensic RAG query failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (response?.answer) {
      navigator.clipboard.writeText(response.answer)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const currentEmail = emails.find(e => e.id === selectedEmailId)

  return (
    <div className={`flex flex-col h-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-3xl overflow-hidden shadow-xl text-[#F5F5F5] ${isModal ? 'max-h-[85vh]' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] bg-[#111111]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#181818] border border-[#2A2A2A] text-[#FF1E2D] shadow-xs">
            <Terminal className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-heading font-extrabold text-[#F5F5F5] flex items-center gap-2">
              SOC Threat Intelligence Forensic Copilot
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FF1E2D]/10 text-[#FF1E2D] font-mono font-bold border border-[#FF1E2D]/30 uppercase">
                Investigator RAG v2.0
              </span>
            </h3>
            <p className="text-xs text-[#737373] font-medium">
              Grounded in NIST SP 800-150 / 800-177r1, CISA Incident Playbooks, Microsoft SecOps, & MITRE ATT&CK
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#F5F5F5] p-2 rounded-xl hover:bg-[#181818] transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#050505]">
        {/* User & Email Telemetry Selectors */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 shadow-xs space-y-4">
          {/* 1. SELECT USER DROPDOWN */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#F5F5F5] flex items-center gap-2">
                <User className="w-4 h-4 text-[#FF1E2D]" />
                Select Monitored User Account (Filters Scanned Emails)
              </label>
              {selectedUserId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserId('')
                    setSelectedEmailId('')
                  }}
                  className="text-[11px] font-bold text-[#FF1E2D] hover:underline cursor-pointer"
                >
                  Show All Users' Emails
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value)
                  setSelectedEmailId('')
                }}
                className="w-full bg-[#181818] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FF1E2D] appearance-none pr-8 cursor-pointer font-medium"
              >
                <option value="">-- All Monitored User Accounts ({users.length || 1} available) --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email} — {u.email} ({u.role?.toUpperCase() || 'USER'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#737373] absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* 2. SELECT EMAIL DROPDOWN */}
          <div className="space-y-1.5 pt-2 border-t border-[#2A2A2A]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#F5F5F5] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FF1E2D]" />
                Target Email Forensic Telemetry
              </label>
              {selectedEmailId && (
                <button
                  type="button"
                  onClick={() => setSelectedEmailId('')}
                  className="text-[11px] font-bold text-[#FF1E2D] hover:underline cursor-pointer"
                >
                  Clear Email Telemetry
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedEmailId}
                onChange={(e) => setSelectedEmailId(e.target.value)}
                className="w-full bg-[#181818] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FF1E2D] appearance-none pr-8 cursor-pointer font-mono"
              >
                <option value="">-- No specific email telemetry selected (General SOC & MITRE Q&A) --</option>
                {filteredEmails.map((e) => (
                  <option key={e.id} value={e.id}>
                    [{e.severity || 'ALERT'}] {e.subject ? (e.subject.length > 45 ? e.subject.slice(0, 45) + '...' : e.subject) : '(No Subject)'} — Sender: {e.sender} — Risk: {e.risk_score || 0}%
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#737373] absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          {currentEmail && (
            <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] text-xs grid grid-cols-2 md:grid-cols-4 gap-2 font-mono">
              <div className="p-2.5 rounded-lg bg-[#111111] border border-[#2A2A2A]">
                <span className="text-[#737373] block text-[10px] font-bold">THREAT LEVEL</span>
                <span className={`font-bold uppercase ${
                  (currentEmail.risk_score || 0) > 60 ? 'text-[#FF1E2D]' : 'text-emerald-400'
                }`}>
                  {currentEmail.severity || 'Medium'} ({currentEmail.risk_score || 0}%)
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#111111] border border-[#2A2A2A]">
                <span className="text-[#737373] block text-[10px] font-bold">AUTH ALIGNMENT</span>
                <span className="text-[#F5F5F5] font-bold truncate block">
                  SPF: {currentEmail.headers?.spf || 'none'} | DMARC: {currentEmail.headers?.dmarc || 'none'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#111111] border border-[#2A2A2A]">
                <span className="text-[#737373] block text-[10px] font-bold">ORIGIN GEO & IP</span>
                <span className="text-[#F5F5F5] truncate block">
                  {currentEmail.geo_intel?.country || 'Unknown'} ({currentEmail.headers?.source_ip || 'N/A'})
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#111111] border border-[#2A2A2A]">
                <span className="text-[#737373] block text-[10px] font-bold">CLASSIFICATION</span>
                <span className="text-[#FF1E2D] font-bold truncate block">
                  {currentEmail.classification || 'Phishing'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Forensic Quick Prompts */}
        <div>
          <div className="text-xs font-bold text-[#737373] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#FF1E2D]" />
            SOC Tier-3 Forensic Workflows
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {forensicPrompts.map((p, idx) => {
              const isDisabled = p.needsEmail && !selectedEmailId
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(p.prompt)}
                  disabled={loading || isDisabled}
                  title={isDisabled ? 'Attach target email telemetry above first' : p.prompt}
                  className={`text-xs px-3.5 py-2.5 rounded-xl border text-left transition-all duration-200 flex items-center justify-between font-medium cursor-pointer ${
                    isDisabled
                      ? 'border-[#2A2A2A] bg-[#181818]/40 text-[#737373] cursor-not-allowed opacity-50'
                      : 'border-[#2A2A2A] bg-[#111111] hover:bg-[#181818] hover:border-[#FF1E2D] text-[#F5F5F5] shadow-xs'
                  }`}
                >
                  <span className="font-semibold truncate">{p.title}</span>
                  <span className="text-[10px] text-[#FF1E2D] font-mono font-bold ml-2 shrink-0">RUN ➔</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-[#FF1E2D]/10 border border-[#FF1E2D]/30 text-[#FF1E2D] text-xs sm:text-sm flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#FF1E2D] shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="p-8 rounded-2xl bg-[#111111] border border-[#2A2A2A] flex flex-col items-center justify-center gap-3 shadow-xs">
            <Loader2 className="w-8 h-8 text-[#FF1E2D] animate-spin" />
            <div className="text-sm text-[#F5F5F5] font-bold">
              Executing Forensic Knowledge Retrieval & MITRE ATT&CK Mapping...
            </div>
            <div className="text-xs text-[#737373]">
              Retrieving playbooks from NIST SP 800-150 / 800-177r1, CISA Incident Playbooks, and Microsoft SecOps
            </div>
          </div>
        )}

        {/* Response Card */}
        {response && !loading && (
          <div className="space-y-4">
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-md relative">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2A2A2A]">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#FF1E2D]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF1E2D] font-mono">
                    SOC Threat Intelligence & Forensic Assessment
                  </span>
                  {response.email_referenced && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono font-bold">
                      TELEMETRY GROUNDED
                    </span>
                  )}
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-semibold text-[#737373] hover:text-[#F5F5F5] transition-colors px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] font-mono cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Report'}</span>
                </button>
              </div>

              {/* Answer Content */}
              <div className="text-[#F5F5F5] text-xs sm:text-sm leading-relaxed space-y-3 whitespace-pre-line font-body">
                {response.answer}
              </div>

              {/* Source Citations */}
              {response.sources && response.sources.length > 0 && (
                <div className="mt-5 pt-4 border-t border-[#2A2A2A]">
                  <button
                    onClick={() => setExpandedSources(!expandedSources)}
                    className="flex items-center justify-between w-full text-xs font-bold text-[#737373] hover:text-[#F5F5F5] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-mono">
                      <BookOpen className="w-3.5 h-3.5 text-[#FF1E2D]" />
                      SOC Playbooks & Standards Referenced ({response.sources.length})
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedSources ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedSources && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pt-2">
                      {response.sources.map((src, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] text-xs hover:border-[#FF1E2D]/50 transition-colors"
                        >
                          <div className="font-bold text-[#FF1E2D] truncate flex items-center justify-between">
                            <span className="truncate">{src.doc_name}</span>
                            <span className="text-[10px] text-[#737373] ml-2 shrink-0 font-mono">Page {src.page}</span>
                          </div>
                          <p className="text-[#A3A3A3] text-[11px] mt-1 line-clamp-2 italic">
                            "{src.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-[#2A2A2A] bg-[#111111]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              selectedEmailId
                ? 'Enter forensic instruction (e.g. Map headers to MITRE ATT&CK, Draft containment plan)...'
                : 'Enter forensic question (e.g. How to analyze DKIM signatures, RFC 7208 SPF syntax)...'
            }
            disabled={loading}
            className="flex-1 bg-[#181818] border border-[#2A2A2A] rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#F5F5F5] placeholder-[#737373] focus:outline-none focus:border-[#FF1E2D] focus:ring-1 focus:ring-[#FF1E2D]/30 font-mono"
          />

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-2xl bg-[#E50914] hover:bg-[#FF1E2D] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Analyze</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default InvestigatorRAGCopilot
