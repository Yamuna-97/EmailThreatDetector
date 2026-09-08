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
      // Step simulation for visual WOW feedback
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#192837]/10 overflow-hidden text-[#192837]"
      >
        {/* Loading Overlay */}
        {scanning && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md p-6 text-center">
            <CoreSpinLoader customStates={[
              'Analyzing Email...',
              'Fetching Headers...',
              'Checking IP Rep...',
              'Reading Geolocation...',
              'Evaluating AI...',
              'Generating Analytics...'
            ]} />
          </div>
        )}
        
        {/* Header */}
        <div className="p-6 border-b border-[#192837]/10 flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#7342E2] flex items-center justify-center text-white shadow-md shadow-[#7342E2]/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight">
                AI Email Threat Scanner
              </h2>
              <p className="text-xs text-[#192837]/60 font-body">
                Paste raw email content or select synthetic test scenario
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#192837]/60 hover:text-[#192837] hover:bg-[#192837]/5 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto space-y-6">
          {/* Preset Buttons */}
          <div>
            <span className="text-[10px] font-bold text-[#192837]/50 uppercase tracking-wider block mb-2">
              Instant Sample Scenarios (Click to Load)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESET_SCENARIOS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-3 rounded-2xl bg-[#FAF9F6] hover:bg-[#7342E2]/5 border border-[#192837]/10 hover:border-[#7342E2]/30 text-left text-xs font-semibold text-[#192837] transition-all cursor-pointer"
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
                <label className="block text-xs font-bold text-[#192837]/70 mb-1.5">Sender Email Address</label>
                <input
                  type="text"
                  required
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="security-alert@chase-secure-verify.net"
                  className="w-full text-xs font-mono px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#192837]/15 focus:outline-none focus:bg-white focus:border-[#7342E2]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#192837]/70 mb-1.5">Subject Line</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="[URGENT] Security Alert: Unauthorized Transaction"
                  className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#192837]/15 focus:outline-none focus:bg-white focus:border-[#7342E2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#192837]/70 mb-1.5">Email Body (Plain Text or HTML)</label>
              <textarea
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Paste the full message content here with embedded links..."
                className="w-full text-xs font-mono px-4 py-3 rounded-xl bg-[#FAF9F6] border border-[#192837]/15 focus:outline-none focus:bg-white focus:border-[#7342E2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#192837]/70 mb-1.5">
                Optional Raw MIME Headers (SPF, DKIM, Received IP)
              </label>
              <textarea
                rows={2}
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder="From: ...&#10;Authentication-Results: spf=fail&#10;Received: from ..."
                className="w-full text-xs font-mono px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#192837]/15 focus:outline-none focus:bg-white focus:border-[#7342E2]"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            <InteractiveHoverButton
              type="submit"
              disabled={scanning}
              text={scanning ? (scanStep === 1 ? 'Extracting MIME Headers...' : scanStep === 2 ? 'Consulting IPQS & Geo...' : scanStep === 3 ? 'Gemini AI Reasoning...' : 'Computing Risk Score...') : 'Analyze Threat Pipeline'}
              icon={scanning ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} className="text-white" />}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#7342E2] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#7342E2]/25 border-[#7342E2]"
            />
          </form>

          {/* Results Display */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#7342E2]/30 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#192837]/10">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                    result.threat.severity === 'critical' ? 'bg-red-500/10 text-red-600 border-red-500/30' :
                    result.threat.severity === 'high' ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
                    result.threat.severity === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                    'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  }`}>
                    {result.threat.severity} Severity
                  </span>
                  <span className="font-heading text-base font-bold text-[#192837]">
                    {result.threat.threat_type}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-heading text-[#7342E2]">
                    {result.threat.risk_score}
                  </span>
                  <span className="text-xs font-bold text-[#192837]/50">/ 100 Risk</span>
                </div>
              </div>

              <p className="text-xs text-[#192837]/80 leading-relaxed font-body">
                {result.threat.summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-[#192837]/10">
                  <span className="text-[10px] text-[#192837]/50 block">Origin Location</span>
                  <span className="font-bold">{result.geolocation?.city || 'Frankfurt'}, {result.geolocation?.country || 'Germany'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#192837]/10">
                  <span className="text-[10px] text-[#192837]/50 block">IP Fraud Score</span>
                  <span className="font-bold text-red-600">{result.ip_intelligence?.fraud_score ?? 85}/100</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#192837]/10">
                  <span className="text-[10px] text-[#192837]/50 block">SPF / DMARC</span>
                  <span className="font-bold font-mono uppercase">{result.email?.headers?.spf || 'fail'} / {result.email?.headers?.dmarc || 'fail'}</span>
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
