import React, { useState } from 'react'
import {
  Sparkles,
  Shield,
  BookOpen,
  Send,
  Loader2,
  Mail,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Copy,
  Check
} from 'lucide-react'
import { ragApi, type RAGQueryResponse } from '../../services/ragApi'

interface UserRAGAssistantProps {
  emails?: any[]
  selectedEmailId?: string
  onClose?: () => void
  isModal?: boolean
}

export const UserRAGAssistant: React.FC<UserRAGAssistantProps> = ({
  emails = [],
  selectedEmailId: initialEmailId,
  onClose,
  isModal = false,
}) => {
  const [selectedEmailId, setSelectedEmailId] = useState<string>(initialEmailId || '')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [response, setResponse] = useState<RAGQueryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedSources, setExpandedSources] = useState(false)

  const quickPrompts = [
    {
      title: 'Why is this email dangerous?',
      prompt: 'Why was this email flagged as a threat and what are the specific red flags in its content and sender?',
      needsEmail: true,
    },
    {
      title: 'What is Phishing vs Spear Phishing?',
      prompt: 'Explain the difference between regular phishing and targeted spear phishing with practical examples.',
      needsEmail: false,
    },
    {
      title: 'How do I spot fake sender addresses?',
      prompt: 'How can I identify domain spoofing and forged sender addresses in everyday emails?',
      needsEmail: false,
    },
    {
      title: 'What should I do if I clicked a link?',
      prompt: 'I accidentally clicked a suspicious link in an email. What immediate safety steps should I take right now?',
      needsEmail: false,
    },
    {
      title: 'What is Business Email Compromise (BEC)?',
      prompt: 'What is Business Email Compromise (BEC) and how do attackers trick employees into wire transfers?',
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
      const res = await ragApi.queryUserRAG(q, selectedEmailId || undefined)
      setResponse(res)
    } catch (err: any) {
      setError(err.message || 'Failed to query Security Knowledge Base.')
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
    <div className={`flex flex-col h-full bg-white border border-[#192837]/10 rounded-3xl overflow-hidden shadow-md text-[#192837] ${isModal ? 'max-h-[85vh]' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#192837]/10 bg-gradient-to-r from-[#FAF8FF] via-white to-[#F0FDF4]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#7342E2]/10 border border-[#7342E2]/25 text-[#7342E2] shadow-xs">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-heading font-extrabold text-[#192837] flex items-center gap-2">
              VaultShield AI Security Advisor
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#7342E2]/10 text-[#7342E2] font-mono font-bold border border-[#7342E2]/20 uppercase">
                User RAG v2.0
              </span>
            </h3>
            <p className="text-xs text-[#192837]/60 font-medium">
              Grounded in official cybersecurity standards (NIST SP 800-50, IC3, ENISA) + your email evidence
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-[#192837]/50 hover:text-[#192837] p-2 rounded-xl hover:bg-[#FAF9F6] transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#FAF9F6]/50">
        {/* Email Context Selector */}
        <div className="bg-white border border-[#192837]/10 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-[#192837] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#7342E2]" />
              Attach Scanned Email Evidence (Optional)
            </label>
            {selectedEmailId && (
              <button
                onClick={() => setSelectedEmailId('')}
                className="text-[11px] font-bold text-[#7342E2] hover:underline cursor-pointer"
              >
                Clear Email Filter (Ask General Questions)
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={selectedEmailId}
              onChange={(e) => setSelectedEmailId(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#192837]/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#192837] focus:outline-none focus:border-[#7342E2] appearance-none pr-8 cursor-pointer font-medium"
            >
              <option value="">-- No specific email attached (General Cybersecurity Q&A) --</option>
              {emails.map((e) => (
                <option key={e.id} value={e.id}>
                  [{e.classification || 'Email'}] {e.subject ? (e.subject.length > 50 ? e.subject.slice(0, 50) + '...' : e.subject) : '(No Subject)'} — From: {e.sender} ({e.risk_score || 0}% Risk)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#192837]/40 absolute right-3 top-3.5 pointer-events-none" />
          </div>

          {currentEmail && (
            <div className="mt-2 p-3 rounded-xl bg-[#FAF8FF] border border-[#7342E2]/20 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#192837] truncate">
                <Shield className="w-4 h-4 text-[#7342E2] shrink-0" />
                <span className="font-semibold truncate">Selected: {currentEmail.subject || 'Email'}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase ${
                (currentEmail.risk_score || 0) > 60 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {currentEmail.risk_score || 0}/100 Risk
              </span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div>
          <div className="text-xs font-bold text-[#192837]/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#7342E2]" />
            Suggested Questions
          </div>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((p, idx) => {
              const isDisabled = p.needsEmail && !selectedEmailId
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(p.prompt)}
                  disabled={loading || isDisabled}
                  title={isDisabled ? 'Select an email above first' : p.prompt}
                  className={`text-xs px-3.5 py-2 rounded-xl border transition-all duration-200 text-left font-medium cursor-pointer ${
                    isDisabled
                      ? 'border-[#192837]/10 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-[#192837]/10 bg-white hover:bg-[#7342E2]/10 hover:border-[#7342E2]/40 text-[#192837] shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {p.title}
                </button>
              )
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="p-8 rounded-2xl bg-white border border-[#7342E2]/20 flex flex-col items-center justify-center gap-3 shadow-xs">
            <Loader2 className="w-8 h-8 text-[#7342E2] animate-spin" />
            <div className="text-sm text-[#192837] font-bold">
              Consulting Knowledge Base & Analyzing Evidence...
            </div>
            <div className="text-xs text-[#192837]/60">
              Retrieving grounded passages from NIST SP 800-50, IC3 Reports & ENISA Guides
            </div>
          </div>
        )}

        {/* Response Card */}
        {response && !loading && (
          <div className="space-y-4">
            <div className="bg-white border border-[#7342E2]/30 rounded-2xl p-6 shadow-md relative">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#192837]/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Security Guidance & Recommendations
                  </span>
                  {response.email_referenced && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      Email Evidence Grounded
                    </span>
                  )}
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-semibold text-[#192837]/70 hover:text-[#7342E2] transition-colors px-2.5 py-1 rounded-lg bg-[#FAF9F6] hover:bg-[#7342E2]/10 border border-[#192837]/10 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Answer Content */}
              <div className="prose prose-slate max-w-none text-[#192837] text-xs sm:text-sm leading-relaxed space-y-3 whitespace-pre-line font-body">
                {response.answer}
              </div>

              {/* Source Citations */}
              {response.sources && response.sources.length > 0 && (
                <div className="mt-5 pt-4 border-t border-[#192837]/10">
                  <button
                    onClick={() => setExpandedSources(!expandedSources)}
                    className="flex items-center justify-between w-full text-xs font-bold text-[#192837]/70 hover:text-[#7342E2] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#7342E2]" />
                      Official Sources & Citations ({response.sources.length})
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedSources ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedSources && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pt-2">
                      {response.sources.map((src, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-[#FAF9F6] border border-[#192837]/10 text-xs hover:border-[#7342E2]/40 transition-colors"
                        >
                          <div className="font-bold text-[#7342E2] truncate flex items-center justify-between">
                            <span className="truncate">{src.doc_name}</span>
                            <span className="text-[10px] text-[#192837]/50 ml-2 shrink-0 font-mono">Page {src.page}</span>
                          </div>
                          <p className="text-[#192837]/70 text-[11px] mt-1 line-clamp-2 italic">
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
      <div className="p-4 border-t border-[#192837]/10 bg-white">
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
                ? 'Ask anything about this email (e.g. Why is it dangerous? Is this link safe?)...'
                : 'Ask any cybersecurity question (e.g. What is spear phishing? How to spot fake senders?)...'
            }
            disabled={loading}
            className="flex-1 bg-[#FAF9F6] border border-[#192837]/15 rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#192837] placeholder-[#192837]/40 focus:outline-none focus:border-[#7342E2] focus:ring-1 focus:ring-[#7342E2]/30 font-medium"
          />

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#7342E2] hover:brightness-110 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Ask AI</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
