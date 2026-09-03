import React, { useState } from 'react'
import SpotlightCard from './SpotlightCard'
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
    color: 'text-emerald-700',
    bgBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
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
    color: 'text-amber-700',
    bgBadge: 'bg-amber-100 text-amber-800 border-amber-300',
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
    color: 'text-orange-700',
    bgBadge: 'bg-orange-100 text-orange-800 border-orange-300',
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
    color: 'text-rose-700',
    bgBadge: 'bg-rose-100 text-rose-800 border-rose-300',
    barColor: 'bg-rose-600',
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
    <section id="risk-score" className="py-24 px-5 sm:px-8 bg-[#FAF9F6] border-b border-[#192837]/6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#7342E2] bg-[#7342E2]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Multi-Variable Threat Assessment
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#192837] tracking-tight mb-4">
            Dynamic Risk Scoring Engine
          </h2>
          <p className="font-body text-base text-[#192837]/75 leading-relaxed">
            VaultShield assigns a precise 0–100 risk score based on header authenticity, domain reputation, NLP intent
            analysis, and geolocation telemetry.
          </p>
        </div>

        {/* Level Switcher Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {riskLevels.map((lvl) => {
            const isActive = lvl.key === selectedKey
            return (
              <button
                key={lvl.key}
                type="button"
                onClick={() => setSelectedKey(lvl.key)}
                className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-xs ${
                  isActive
                    ? 'bg-[#192837] text-white shadow-md scale-105'
                    : 'bg-white text-[#192837] border border-[#192837]/10 hover:bg-[#FAF9F6]'
                }`}
              >
                {lvl.level} ({lvl.score}/100)
              </button>
            )
          })}
        </div>

        {/* Live Threat Assessment Display Card using SpotlightCard */}
        <SpotlightCard
          spotlightColor="rgba(115, 66, 226, 0.16)"
          className="max-w-4xl mx-auto bg-white border border-[#192837]/10 p-7 sm:p-10 rounded-3xl shadow-xl text-left"
        >
          {/* Top Bar with Score Meter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#192837]/10 mb-8">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#192837]/60 uppercase tracking-wide">
                  Overall Risk Score
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`font-heading text-4xl sm:text-5xl font-extrabold ${current.color}`}>
                    {current.score}
                  </span>
                  <span className="text-sm font-semibold text-[#192837]/50">/ 100</span>
                </div>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider ${current.bgBadge}`}>
                {current.level} Severity
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-[#192837]/70">
              <div>
                <span className="text-[#192837]/50 block text-[10px] uppercase font-bold">Model Confidence</span>
                <span className="text-sm font-bold text-[#192837]">{current.confidence}</span>
              </div>
              <div className="h-8 w-px bg-[#192837]/10" />
              <div>
                <span className="text-[#192837]/50 block text-[10px] uppercase font-bold">Threat Class</span>
                <span className="text-sm font-bold text-[#7342E2]">{current.category}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#FAF9F6] h-3 rounded-full overflow-hidden border border-[#192837]/8 mb-8">
            <div
              className={`h-full ${current.barColor} transition-all duration-500 rounded-full`}
              style={{ width: `${current.score}%` }}
            />
          </div>

          {/* Email Subject & Sender Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/8">
              <span className="text-[11px] font-bold text-[#192837]/50 uppercase tracking-wide block mb-1">
                Analyzed Subject Line
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#192837]">{current.subject}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/8">
              <span className="text-[11px] font-bold text-[#192837]/50 uppercase tracking-wide block mb-1">
                Sender & Infrastructure
              </span>
              <p className="text-xs font-mono font-semibold text-[#192837] truncate">{current.sender}</p>
              <p className="text-[11px] text-[#192837]/70 font-mono mt-0.5">{current.ip}</p>
            </div>
          </div>

          {/* Reason for Classification */}
          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#192837]/8 mb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-[#192837] mb-2 uppercase tracking-wide">
              <Info size={15} className="text-[#7342E2]" />
              Reason for Classification
            </div>
            <p className="text-xs sm:text-sm text-[#192837]/80 leading-relaxed font-body">
              {current.reason}
            </p>
          </div>

          {/* Detected Indicators Grid */}
          <div className="pt-4 border-t border-[#192837]/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#192837]/60 mb-3">
              <Layers size={14} /> Detected Forensic Indicators
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {current.indicators.map((ind) => (
                <div
                  key={ind}
                  className="flex items-center gap-2 text-xs font-medium text-[#192837] bg-[#FAF9F6] p-2.5 rounded-xl border border-[#192837]/6"
                >
                  <CheckCircle size={14} className="text-[#7342E2] shrink-0" />
                  <span>{ind}</span>
                </div>
              ))}
            </div>
          </div>
        </SpotlightCard>
      </div>
    </section>
  )
}

export default RiskScore
