import React, { useState } from 'react'
import Card from './Card'
import ScrollReveal from './ScrollReveal'
import {
  CheckCircle,
  Info,
  Layers,
} from 'lucide-react'

const riskLevels = [
  {
    key: 'safe',
    level: 'Safe',
    score: 12,
    color: 'text-emerald-400',
    bgBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    barColor: 'bg-emerald-500',
    category: 'Legitimate Transaction Notice',
    confidence: '99.4%',
    subject: 'GitHub: Your security advisory digest for September 2026',
    sender: 'notifications@github.com',
    ip: '140.82.112.4 (Verified GitHub ASN)',
    reason: 'Cryptographic SPF/DKIM/DMARC valid. Domain age > 15 years. No suspicious language, credential request, or high-risk IP relays detected.',
    indicators: [
      'SPF: PASS (github.com)',
      'DKIM: PASS (rsa-2048)',
      'Clean domain reputation',
      'No anomalous link redirects',
    ],
  },
  {
    key: 'suspicious',
    level: 'Suspicious',
    score: 54,
    color: 'text-amber-400',
    bgBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    barColor: 'bg-amber-500',
    category: 'Marketing Tracking & Aggressive Urgency',
    confidence: '88.2%',
    subject: 'Action Required: Your subscription renewal confirmation',
    sender: 'offers@promo-deliverycloud.net',
    ip: '198.51.100.22 (Shared Hosting)',
    reason: 'Newly registered sender domain (14 days old). Contains tracking pixels and mild pressure words. Origin IP has moderate spam history.',
    indicators: [
      'Domain Age: 14 Days',
      'SPF: PASS / DKIM: SoftFail',
      'Tracking Pixel Detected',
      'Generic Greeting Pattern',
    ],
  },
  {
    key: 'high-risk',
    level: 'High Risk',
    score: 82,
    color: 'text-orange-400',
    bgBadge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    barColor: 'bg-orange-500',
    category: 'Credential Harvesting & Fake Login Portal',
    confidence: '95.1%',
    subject: 'IT Helpdesk: Critical password expiration in 2 hours',
    sender: 'admin@corporate-portal-auth.com',
    ip: '45.154.255.89 (Foreign Datacenter)',
    reason: 'Deceptive domain mimicking internal corporate portal. Hyperlinks redirect through intermediate dynamic DNS host. High psychological urgency detected.',
    indicators: [
      'Typosquatted Internal Domain',
      'Credential Harvester Link',
      'Urgency Timer Detected',
      'DMARC Policy Failure',
    ],
  },
  {
    key: 'critical',
    level: 'Critical',
    score: 96,
    color: 'text-[#FF1E2D]',
    bgBadge: 'bg-[#FF1E2D]/10 text-[#FF1E2D] border-[#FF1E2D]/20',
    barColor: 'bg-[#FF1E2D]',
    category: 'Executive Impersonation & Wire Fraud (BEC)',
    confidence: '98.7%',
    subject: 'CONFIDENTIAL: Urgent Acquisition Wire Settlement Needed',
    sender: 'ceo-executive@corporate-offshore.org',
    ip: '185.220.101.44 (Tor Exit Node)',
    reason: 'High-severity BEC attack. Sender impersonates Chief Executive Officer demanding urgent offshore fund routing. IP originates from Tor network with zero authentication.',
    indicators: [
      'Tor Exit Node Routing',
      'Forged CEO Display Name',
      'Fraudulent Wire Routing Details',
      'SPF/DKIM Complete Failure',
    ],
  },
]

export const RiskScore: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('critical')
  const current = riskLevels.find((r) => r.key === selectedKey) || riskLevels[3]

  return (
    <section id="risk-score" className="py-24 px-5 sm:px-8 bg-[#050505] border-b border-[#2A2A2A]">
      <div className="max-w-[1280px] mx-auto">
        <ScrollReveal delay={0.05}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF1E2D] bg-[#FF1E2D]/10 border border-[#FF1E2D]/20 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Multi-Variable Threat Assessment
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight mb-4">
              Dynamic Risk Scoring Engine
            </h2>
            <p className="font-body text-base text-[#A3A3A3] leading-relaxed">
              CyberTrace assigns a precise 0–100 risk score based on header authenticity, domain reputation, NLP intent
              analysis, and geolocation telemetry.
            </p>
          </div>
        </ScrollReveal>

        {/* Level Switcher Buttons */}
        <ScrollReveal delay={0.12}>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {riskLevels.map((lvl) => {
              const isActive = lvl.key === selectedKey
              return (
                <button
                  key={lvl.key}
                  type="button"
                  onClick={() => setSelectedKey(lvl.key)}
                  className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#E50914] text-white shadow-lg shadow-[#E50914]/25 border border-[#FF1E2D] scale-105'
                      : 'bg-[#111111] text-[#A3A3A3] border border-[#2A2A2A] hover:bg-[#181818] hover:text-[#F5F5F5]'
                  }`}
                >
                  {lvl.level} ({lvl.score}/100)
                </button>
              )
            })}
          </div>
        </ScrollReveal>

        {/* Live Threat Assessment Display Card using unified Card */}
        <ScrollReveal delay={0.18} yOffset={45} scaleStart={0.93}>
          <Card
            badge={`${current.level.toUpperCase()} SEVERITY`}
            title={`Overall Risk Score: ${current.score}/100`}
            description={`Threat Class: ${current.category} • Model Confidence: ${current.confidence}`}
            className="max-w-4xl mx-auto p-7 sm:p-10 text-left bg-[#111111] border-[#2A2A2A] shadow-2xl"
          >
            {/* Progress Bar */}
            <div className="w-full bg-[#181818] h-3 rounded-full overflow-hidden border border-[#2A2A2A] mb-8 mt-4">
              <div
                className={`h-full ${current.barColor} transition-all duration-500 rounded-full shadow-sm`}
                style={{ width: `${current.score}%` }}
              />
            </div>

            {/* Email Subject & Sender Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A]">
                <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wide block mb-1">
                  Analyzed Subject Line
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#F5F5F5]">{current.subject}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A]">
                <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wide block mb-1">
                  Sender & Infrastructure
                </span>
                <p className="text-xs font-mono font-semibold text-[#F5F5F5] truncate">{current.sender}</p>
                <p className="text-[11px] text-[#A3A3A3] font-mono mt-0.5">{current.ip}</p>
              </div>
            </div>

            {/* Reason for Classification */}
            <div className="p-5 rounded-2xl bg-[#181818] border border-[#2A2A2A] mb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F5F5F5] mb-2 uppercase tracking-wide">
                <Info size={15} className="text-[#FF1E2D]" />
                Reason for Classification
              </div>
              <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed font-body">
                {current.reason}
              </p>
            </div>

            {/* Detected Indicators Grid */}
            <div className="pt-4 border-t border-[#2A2A2A]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#737373] mb-3">
                <Layers size={14} /> Detected Forensic Indicators
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {current.indicators.map((ind) => (
                  <div
                    key={ind}
                    className="flex items-center gap-2 text-xs font-medium text-[#F5F5F5] bg-[#181818] p-2.5 rounded-xl border border-[#2A2A2A]"
                  >
                    <CheckCircle size={14} className="text-[#FF1E2D] shrink-0" />
                    <span>{ind}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </ScrollReveal>
      </div>
    </section>
  )
}

export default RiskScore
