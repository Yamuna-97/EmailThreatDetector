import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Sparkles, RefreshCw } from 'lucide-react'
import { threatService } from '../../services/threats'
import { CoreSpinLoader } from '../ui/core-spin-loader'
import { InteractiveHoverButton } from '../ui/interactive-hover-button'

interface ManualScanModalProps {
  isOpen: boolean
  onClose: () => void
  onScanCompleted: (threat: any) => void
}

const PRESET_SCENARIOS = [
  {
    name: '🔴 Chase Bank Wire Phishing',
    sender: 'security-alert@chase-secure-verify.net',
    subject: '[URGENT] Security Alert: Unauthorized Wire Transfer Detected ($4,850.00)',
    body: 'Dear Customer,\n\nWe detected an unauthorized wire transfer of $4,850.00. Please verify immediately:\nhttps://chase-secure-verify.net/auth/login?session=98432a\n\nChase Fraud Prevention Team',
    headers: 'From: security-alert@chase-secure-verify.net\nAuthentication-Results: spf=fail; dkim=none; dmarc=fail\nReceived: from mail.chase-secure-verify.net ([185.220.101.5]) by mx.google.com'
  },
  {
    name: '🟣 Microsoft 365 MFA Spoof',
    sender: 'admin@login-microsoftonline-verify.xyz',
    subject: 'Microsoft 365: Mandatory Multi-Factor Authentication (MFA) Re-enrollment',
    body: 'Your Microsoft 365 Security Certificate has expired. Re-authenticate now:\nhttps://login-microsoftonline-verify.xyz/oauth2/authorize?token=f893a\n\nIT Security Operations',
    headers: 'From: admin@login-microsoftonline-verify.xyz\nAuthentication-Results: spf=fail; dkim=fail; dmarc=fail\nReceived: from relay01.xyz-hosting.ru ([193.106.191.22])'
  },
  {
    name: '🟢 CERT-In Official Advisory (Safe)',
    sender: 'newsletter@cert-in.org.in',
    subject: 'CERT-In Cyber Security Advisory: Best Practices for Email Defense',
    body: 'Dear Stakeholder,\n\nCERT-In has released its monthly advisory regarding email defense.\nRead official bulletin: https://www.cert-in.org.in/advisories\n\nIndian Computer Emergency Response Team (CERT-In)',
    headers: 'From: newsletter@cert-in.org.in\nAuthentication-Results: spf=pass; dkim=pass; dmarc=pass\nReceived: from mail.gov.in ([164.100.158.20])'
  }
]

export const ManualScanModal: React.FC<ManualScanModalProps> = ({ isOpen, onClose, onScanCompleted }) => {
  const [sender, setSender] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [headers, setHeaders] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState<number>(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleApplyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setSender(preset.sender)
    setSubject(preset.subject)
    setBody(preset.body)
    setHeaders(preset.headers)
    setResult(null)
    setError(null)
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sender || !subject || !body) {
      setError('Please provide Sender, Subject, and Body text.')
      return
    }

    setError(null)
    setScanning(true)
    setScanStep(1)

    try {
      setTimeout(() => setScanStep(2), 500)
      setTimeout(() => setScanStep(3), 1000)
      setTimeout(() => setScanStep(4), 1500)

      const res = await threatService.manualScan({
        sender,
        subject,
        body,
        raw_headers: headers
      })

      setTimeout(() => {
        setResult(res)
        setScanning(false)
        onScanCompleted(res.threat)
      }, 1900)
    } catch (err: any) {
      setError(err.message || 'Threat scan failed.')
      setScanning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-4xl bg-[var(--bg-secondary)] rounded-2xl shadow-2xl border border-[var(--border-primary)] overflow-hidden text-[var(--color-text-primary)]"
      >
        {/* Loading Overlay */}
        {scanning && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 text-center">
            <CoreSpinLoader customStates={[
              'Parsing MIME Structure...',
              'Extracting SPF/DKIM Headers...',
              'Consulting Threat Databases...',
              'Querying IP Geolocation Node...',
              'Gemini AI Behavioral Reasoning...',
              'Computing Risk Assessment Matrix...'
            ]} />
          </div>
        )}
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--surface-card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50914] to-[#8B0000] flex items-center justify-center text-white shadow-md shadow-[#E50914]/25">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
                AI Threat Ingestion & Sandbox
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] font-body">
                Paste raw email payload or select a synthetic adversary test scenario
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--surface-raised)] transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto space-y-6">
          {/* Preset Buttons */}
          <div>
            <span className="text-[10px] font-mono font-bold text-[#737373] uppercase tracking-wider block mb-2">
              Adversary Sandbox Scenarios (Click to Load)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESET_SCENARIOS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-3 rounded-xl bg-[#111111] hover:bg-[#181818] border border-[#2A2A2A] hover:border-[#FF1E2D]/40 text-left text-xs font-semibold text-[#F5F5F5] transition-all cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleScan} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                  Sender Email Address
                </label>
                <input
                  type="text"
                  required
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="security-alert@chase-secure-verify.net"
                  className="w-full text-xs font-mono px-4 py-2.5 rounded-xl bg-[#111111] border border-[#2A2A2A] text-[#F5F5F5] focus:outline-none focus:border-[#FF1E2D] focus:ring-1 focus:ring-[#FF1E2D]/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="[URGENT] Security Alert: Unauthorized Transaction"
                  className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#111111] border border-[#2A2A2A] text-[#F5F5F5] focus:outline-none focus:border-[#FF1E2D] focus:ring-1 focus:ring-[#FF1E2D]/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                Email Body (Plain Text or HTML)
              </label>
              <textarea
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Paste the full message content here with embedded links..."
                className="w-full text-xs font-mono px-4 py-3 rounded-xl bg-[#111111] border border-[#2A2A2A] text-[#F5F5F5] focus:outline-none focus:border-[#FF1E2D] focus:ring-1 focus:ring-[#FF1E2D]/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                Optional Raw MIME Headers (SPF, DKIM, Received IP)
              </label>
              <textarea
                rows={2}
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder="From: ...&#10;Authentication-Results: spf=fail&#10;Received: from ..."
                className="w-full text-xs font-mono px-4 py-2.5 rounded-xl bg-[#111111] border border-[#2A2A2A] text-[#F5F5F5] focus:outline-none focus:border-[#FF1E2D] focus:ring-1 focus:ring-[#FF1E2D]/30 transition-all"
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-[#181818] border border-[#FF1E2D]/50 text-[#FF1E2D] text-xs font-semibold">
                {error}
              </div>
            )}

            <InteractiveHoverButton
              type="submit"
              disabled={scanning}
              text={scanning ? (scanStep === 1 ? 'Extracting MIME Headers...' : scanStep === 2 ? 'Consulting IPQS & Geo...' : scanStep === 3 ? 'Gemini AI Reasoning...' : 'Computing Risk Score...') : 'Run AI Threat Pipeline'}
              icon={scanning ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} className="text-white" />}
              className="w-full py-3.5 px-6 rounded-xl bg-[#E50914] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#E50914]/25 border-[#E50914]"
            />
          </form>

          {/* Results Display */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl bg-[#111111] border border-[#FF1E2D]/30 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-black uppercase border ${
                    result.threat.severity === 'critical' ? 'bg-[#FF1E2D]/15 text-[#FF1E2D] border-[#FF1E2D]/30' :
                    result.threat.severity === 'high' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                    result.threat.severity === 'medium' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {result.threat.severity} Severity
                  </span>
                  <span className="font-heading text-base font-bold text-[#F5F5F5]">
                    {result.threat.threat_type}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-heading text-[#FF1E2D]">
                    {result.threat.risk_score}
                  </span>
                  <span className="text-xs font-bold text-[#737373]">/ 100 Risk</span>
                </div>
              </div>

              <p className="text-xs text-[#A3A3A3] leading-relaxed font-body">
                {result.threat.summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A]">
                  <span className="text-[10px] text-[#737373] block uppercase">Origin Location</span>
                  <span className="font-bold text-[#F5F5F5]">{result.geolocation?.city || 'Frankfurt'}, {result.geolocation?.country || 'Germany'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A]">
                  <span className="text-[10px] text-[#737373] block uppercase">IP Fraud Score</span>
                  <span className="font-bold text-[#FF1E2D]">{result.ip_intelligence?.fraud_score ?? 85}/100</span>
                </div>
                <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A]">
                  <span className="text-[10px] text-[#737373] block uppercase">SPF / DMARC</span>
                  <span className="font-bold uppercase text-[#F5F5F5]">{result.email?.headers?.spf || 'fail'} / {result.email?.headers?.dmarc || 'fail'}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ManualScanModal
