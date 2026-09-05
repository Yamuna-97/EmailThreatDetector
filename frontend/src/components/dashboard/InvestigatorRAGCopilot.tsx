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
    <div className={`flex flex-col h-full bg-white border border-[#D8C8FF] rounded-3xl overflow-hidden shadow-md text-[#1F1F29] ${isModal ? 'max-h-[85vh]' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8C8FF] bg-gradient-to-r from-[#FAF8FF] via-white to-[#F5F3FF]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#F5F3FF] border border-[#D8C8FF] text-[#7342E2] shadow-xs">
            <Terminal className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-heading font-extrabold text-[#1F1F29] flex items-center gap-2">
              SOC Threat Intelligence Forensic Copilot
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#F5F3FF] text-[#7342E2] font-mono font-bold border border-[#D8C8FF] uppercase">
                Investigator RAG v2.0
              </span>
            </h3>
            <p className="text-xs text-[#6B7280] font-medium">
              Grounded in NIST SP 800-150 / 800-177r1, CISA Incident Playbooks, Microsoft SecOps, & MITRE ATT&CK
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#1F1F29] p-2 rounded-xl hover:bg-[#FAF8FF] transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#FAFAFC]/60">
        {/* User & Email Telemetry Selectors */}
        <div className="bg-white border border-[#D8C8FF] rounded-2xl p-5 shadow-xs space-y-4">
          {/* 1. SELECT USER DROPDOWN (NEW) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1F1F29] flex items-center gap-2">
                <User className="w-4 h-4 text-[#7342E2]" />
                Select Monitored User Account (Filters Scanned Emails)
              </label>
              {selectedUserId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserId('')
                    setSelectedEmailId('')
                  }}
                  className="text-[11px] font-bold text-[#7342E2] hover:underline cursor-pointer"
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
                className="w-full bg-[#FAFAFC] border border-[#D8C8FF] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1F1F29] focus:outline-none focus:border-[#7342E2] appearance-none pr-8 cursor-pointer font-medium"
              >
                <option value="">-- All Monitored User Accounts ({users.length || 1} available) --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email} — {u.email} ({u.role?.toUpperCase() || 'USER'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* 2. SELECT EMAIL DROPDOWN */}
          <div className="space-y-1.5 pt-2 border-t border-[#D8C8FF]/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1F1F29] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#7342E2]" />
                Target Email Forensic Telemetry
              </label>
              {selectedEmailId && (
                <button
                  type="button"
                  onClick={() => setSelectedEmailId('')}
                  className="text-[11px] font-bold text-[#7342E2] hover:underline cursor-pointer"
                >
                  Clear Email Telemetry
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedEmailId}
                onChange={(e) => setSelectedEmailId(e.target.value)}
                className="w-full bg-[#FAFAFC] border border-[#D8C8FF] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1F1F29] focus:outline-none focus:border-[#7342E2] appearance-none pr-8 cursor-pointer font-mono"
              >
                <option value="">-- No specific email telemetry selected (General SOC & MITRE Q&A) --</option>
                {filteredEmails.map((e) => (
                  <option key={e.id} value={e.id}>
                    [{e.severity || 'ALERT'}] {e.subject ? (e.subject.length > 45 ? e.subject.slice(0, 45) + '...' : e.subject) : '(No Subject)'} — Sender: {e.sender} — Risk: {e.risk_score || 0}%
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          {currentEmail && (
            <div className="p-3 rounded-xl bg-[#FAF8FF] border border-[#D8C8FF] text-xs grid grid-cols-2 md:grid-cols-4 gap-2 font-mono">
              <div className="p-2.5 rounded-lg bg-white border border-[#D8C8FF]/80">
                <span className="text-[#6B7280] block text-[10px] font-bold">THREAT LEVEL</span>
                <span className={`font-bold uppercase ${
                  (currentEmail.risk_score || 0) > 60 ? 'text-red-600' : 'text-emerald-600'
                }`}>
                  {currentEmail.severity || 'Medium'} ({currentEmail.risk_score || 0}%)
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[#D8C8FF]/80">
                <span className="text-[#6B7280] block text-[10px] font-bold">AUTH ALIGNMENT</span>
                <span className="text-[#1F1F29] font-bold truncate block">
                  SPF: {currentEmail.headers?.spf || 'none'} | DMARC: {currentEmail.headers?.dmarc || 'none'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[#D8C8FF]/80">
                <span className="text-[#6B7280] block text-[10px] font-bold">ORIGIN GEO & IP</span>
                <span className="text-[#1F1F29] truncate block">
                  {currentEmail.geo_intel?.country || 'Unknown'} ({currentEmail.headers?.source_ip || 'N/A'})
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[#D8C8FF]/80">
                <span className="text-[#6B7280] block text-[10px] font-bold">CLASSIFICATION</span>
                <span className="text-[#7342E2] font-bold truncate block">
                  {currentEmail.classification || 'Phishing'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Forensic Quick Prompts */}
        <div>
          <div className="text-xs font-bold text-[#1F1F29]/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#7342E2]" />
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
                      ? 'border-[#D8C8FF]/50 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-[#D8C8FF] bg-white hover:bg-[#F5F3FF] hover:border-[#7342E2] text-[#1F1F29] shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <span className="font-semibold truncate">{p.title}</span>
                  <span className="text-[10px] text-[#7342E2] font-mono font-bold ml-2 shrink-0">RUN ➔</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="p-8 rounded-2xl bg-white border border-[#D8C8FF] flex flex-col items-center justify-center gap-3 shadow-xs">
            <Loader2 className="w-8 h-8 text-[#7342E2] animate-spin" />
            <div className="text-sm text-[#1F1F29] font-bold">
              Executing Forensic Knowledge Retrieval & MITRE ATT&CK Mapping...
            </div>
            <div className="text-xs text-[#6B7280]">
              Retrieving playbooks from NIST SP 800-150 / 800-177r1, CISA Incident Playbooks, and Microsoft SecOps
            </div>
          </div>
        )}

        {/* Response Card */}
        {response && !loading && (
          <div className="space-y-4">
            <div className="bg-white border border-[#D8C8FF] rounded-2xl p-6 shadow-md relative">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D8C8FF]">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#7342E2]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7342E2] font-mono">
                    SOC Threat Intelligence & Forensic Assessment
                  </span>
                  {response.email_referenced && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold">
                      TELEMETRY GROUNDED
                    </span>
                  )}
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-semibold text-[#6B7280] hover:text-[#7342E2] transition-colors px-2.5 py-1 rounded-lg bg-[#FAF8FF] hover:bg-[#F5F3FF] border border-[#D8C8FF] font-mono cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Report'}</span>
                </button>
              </div>

              {/* Answer Content */}
              <div className="prose prose-slate max-w-none text-[#1F1F29] text-xs sm:text-sm leading-relaxed space-y-3 whitespace-pre-line font-body">
                {response.answer}
              </div>

              {/* Source Citations */}
              {response.sources && response.sources.length > 0 && (
                <div className="mt-5 pt-4 border-t border-[#D8C8FF]">
                  <button
                    onClick={() => setExpandedSources(!expandedSources)}
                    className="flex items-center justify-between w-full text-xs font-bold text-[#6B7280] hover:text-[#7342E2] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-mono">
                      <BookOpen className="w-3.5 h-3.5 text-[#7342E2]" />
                      SOC Playbooks & Standards Referenced ({response.sources.length})
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedSources ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedSources && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pt-2">
                      {response.sources.map((src, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-[#FAF8FF] border border-[#D8C8FF] text-xs hover:border-[#7342E2]/60 transition-colors"
                        >
                          <div className="font-bold text-[#7342E2] truncate flex items-center justify-between">
                            <span className="truncate">{src.doc_name}</span>
                            <span className="text-[10px] text-[#6B7280] ml-2 shrink-0 font-mono">Page {src.page}</span>
                          </div>
                          <p className="text-[#6B7280] text-[11px] mt-1 line-clamp-2 italic">
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
      <div className="p-4 border-t border-[#D8C8FF] bg-white">
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
            className="flex-1 bg-[#FAFAFC] border border-[#D8C8FF] rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#1F1F29] placeholder-[#6B7280]/60 focus:outline-none focus:border-[#7342E2] focus:ring-1 focus:ring-[#7342E2]/30 font-mono"
          />

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-2xl bg-[#7342E2] hover:bg-[#6032C4] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono cursor-pointer"
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
