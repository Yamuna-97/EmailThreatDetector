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
    <div className={`flex flex-col h-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-3xl overflow-hidden shadow-xl text-[#F5F5F5] ${isModal ? 'max-h-[85vh]' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] bg-[#111111]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#181818] border border-[#2A2A2A] text-[#FF1E2D] shadow-xs">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-heading font-extrabold text-[#F5F5F5] flex items-center gap-2">
              CyberTrace AI Security Advisor
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FF1E2D]/10 text-[#FF1E2D] font-mono font-bold border border-[#FF1E2D]/30 uppercase">
                User RAG v2.0
              </span>
            </h3>
            <p className="text-xs text-[#737373] font-medium">
              Grounded in official cybersecurity standards (NIST SP 800-50, IC3, ENISA) + your email evidence
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
        {/* Email Context Selector */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-[#F5F5F5] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#FF1E2D]" />
              Attach Scanned Email Evidence (Optional)
            </label>
            {selectedEmailId && (
              <button
                onClick={() => setSelectedEmailId('')}
                className="text-[11px] font-bold text-[#FF1E2D] hover:underline cursor-pointer"
              >
                Clear Email Filter (Ask General Questions)
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={selectedEmailId}
              onChange={(e) => setSelectedEmailId(e.target.value)}
              className="w-full bg-[#181818] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FF1E2D] appearance-none pr-8 cursor-pointer font-medium"
            >
              <option value="">-- No specific email attached (General Cybersecurity Q&A) --</option>
              {emails.map((e) => (
                <option key={e.id} value={e.id}>
                  [{e.classification || 'Email'}] {e.subject ? (e.subject.length > 50 ? e.subject.slice(0, 50) + '...' : e.subject) : '(No Subject)'} — From: {e.sender} ({e.risk_score || 0}% Risk)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#737373] absolute right-3 top-3.5 pointer-events-none" />
          </div>

          {currentEmail && (
            <div className="mt-2 p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#F5F5F5] truncate">
                <Shield className="w-4 h-4 text-[#FF1E2D] shrink-0" />
                <span className="font-semibold truncate">Selected: {currentEmail.subject || 'Email'}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase ${
                (currentEmail.risk_score || 0) > 60 ? 'bg-[#FF1E2D]/15 text-[#FF1E2D] border border-[#FF1E2D]/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                {currentEmail.risk_score || 0}/100 Risk
              </span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div>
          <div className="text-xs font-bold text-[#737373] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#FF1E2D]" />
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
                      ? 'border-[#2A2A2A] bg-[#181818]/40 text-[#737373] cursor-not-allowed opacity-50'
                      : 'border-[#2A2A2A] bg-[#111111] hover:bg-[#181818] hover:border-[#FF1E2D] text-[#F5F5F5] shadow-xs'
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
          <div className="p-4 rounded-2xl bg-[#FF1E2D]/10 border border-[#FF1E2D]/30 text-[#FF1E2D] text-xs sm:text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#FF1E2D] shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="p-8 rounded-2xl bg-[#111111] border border-[#2A2A2A] flex flex-col items-center justify-center gap-3 shadow-xs">
            <Loader2 className="w-8 h-8 text-[#FF1E2D] animate-spin" />
            <div className="text-sm text-[#F5F5F5] font-bold">
              Consulting Knowledge Base & Analyzing Evidence...
            </div>
            <div className="text-xs text-[#737373]">
              Retrieving grounded passages from NIST SP 800-50, IC3 Reports & ENISA Guides
            </div>
          </div>
        )}

        {/* Response Card */}
        {response && !loading && (
          <div className="space-y-4">
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-md relative">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2A2A2A]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Security Guidance & Recommendations
                  </span>
                  {response.email_referenced && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">
                      Email Evidence Grounded
                    </span>
                  )}
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-semibold text-[#737373] hover:text-[#F5F5F5] transition-colors px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
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
                      Official Sources & Citations ({response.sources.length})
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
                ? 'Ask anything about this email (e.g. Why is it dangerous? Is this link safe?)...'
                : 'Ask any cybersecurity question (e.g. What is spear phishing? How to spot fake senders?)...'
            }
            disabled={loading}
            className="flex-1 bg-[#181818] border border-[#2A2A2A] rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#F5F5F5] placeholder-[#737373] focus:outline-none focus:border-[#FF1E2D] focus:ring-1 focus:ring-[#FF1E2D]/30 font-medium"
          />

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-2xl bg-[#E50914] hover:bg-[#FF1E2D] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
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

export default UserRAGAssistant
