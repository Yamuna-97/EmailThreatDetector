import React from 'react'
import SpotlightCard from './SpotlightCard'
import {
  Fish,
  UserX,
  ShieldAlert,
  Briefcase,
  FileWarning,
  CircleDollarSign,
  CheckCircle,
} from 'lucide-react'

const threats = [
  {
    title: 'Phishing Detection',
    tag: 'Credential Theft',
    icon: Fish,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    desc: 'Deep inspection of malicious hyperlinks, deceptive login pages, and zero-day credential harvesting schemes.',
    indicators: ['Lookalike URLs', 'Fake OAuth dialogs', 'Homograph attacks'],
  },
  {
    title: 'Email Spoofing',
    tag: 'Authentication Failure',
    icon: ShieldAlert,
    color: 'text-rose-600',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
    desc: 'Analyzes raw headers for SPF, DKIM, and DMARC alignment mismatches to catch forged sender identities.',
    indicators: ['Header anomalies', 'Mismatched envelope-from', 'Relay spoofing'],
  },
  {
    title: 'Executive Impersonation',
    tag: 'VIP Protection',
    icon: UserX,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    desc: 'Detects display name manipulation and lookalike mailbox domains impersonating C-suite executives and VIPs.',
    indicators: ['Display name spoofing', 'Cousin domains', 'Urgency vectors'],
  },
  {
    title: 'Business Email Compromise (BEC)',
    tag: 'Account Takeover',
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    desc: 'Uncovers hijacked vendor threads, invoice modifications, and malicious payroll redirection requests.',
    indicators: ['Thread hijacking', 'Invoice tampering', 'Banking change requests'],
  },
  {
    title: 'Malware & Suspicious Links',
    tag: 'Payload Analysis',
    icon: FileWarning,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    desc: 'Disassembles weaponized attachments (PDFs, macros, ISOs) and analyzes multi-redirect URL execution chains.',
    indicators: ['Hidden macro code', 'Multi-hop redirects', 'Suspicious MIME types'],
  },
  {
    title: 'Financial & Wire Fraud',
    tag: 'Revenue Protection',
    icon: CircleDollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    desc: 'Flags high-pressure extortion demands, fraudulent ACH routing numbers, and gift card coercion tactics.',
    indicators: ['Routing number validation', 'Extortion keywords', 'Payment bypass'],
  },
]

export const ThreatDetection: React.FC = () => {
  return (
    <section id="detection" className="py-24 px-5 sm:px-8 bg-[#FAF9F6] border-b border-[#192837]/6">
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#7342E2] bg-[#7342E2]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Core Threat Vector Coverage
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#192837] tracking-tight mb-4">
            Comprehensive Email Threat Detection
          </h2>
          <p className="font-body text-base text-[#192837]/75 leading-relaxed">
            VaultShield intercepts advanced cyberattacks targeting corporate inboxes using multi-layer heuristic
            scoring, NLP intent extraction, and real-time threat intelligence.
          </p>
        </div>

        {/* 6 Threat Cards using SpotlightCard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {threats.map((t) => {
            const Icon = t.icon
            return (
              <SpotlightCard
                key={t.title}
                spotlightColor="rgba(115, 66, 226, 0.14)"
                className="bg-white border border-[#192837]/8 p-7 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3 rounded-2xl ${t.bgColor} ${t.color}`}>
                      <Icon size={24} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#192837]/5 text-[#192837]/70 border border-[#192837]/5">
                      {t.tag}
                    </span>
                  </div>

                  <h3 className="font-heading text-lg font-bold text-[#192837] mb-2">{t.title}</h3>
                  <p className="font-body text-sm text-[#192837]/75 leading-relaxed mb-6">{t.desc}</p>
                </div>

                <div className="pt-4 border-t border-[#192837]/8 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#192837]/50">
                    Key Indicators
                  </div>
                  {t.indicators.map((ind) => (
                    <div key={ind} className="flex items-center gap-2 text-xs text-[#192837]/85 font-medium">
                      <CheckCircle size={13} className="text-[#7342E2] shrink-0" />
                      <span>{ind}</span>
                    </div>
                  ))}
                </div>
              </SpotlightCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ThreatDetection
