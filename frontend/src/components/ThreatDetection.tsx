import React from 'react'
import Card from './Card'
import ScrollReveal from './ScrollReveal'
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
    badge: 'AI DETECTION',
    icon: Fish,
    color: 'text-amber-600',
    desc: 'Deep inspection of malicious hyperlinks, deceptive login pages, and zero-day credential harvesting schemes.',
    indicators: ['Lookalike URLs', 'Fake OAuth dialogs', 'Homograph attacks'],
  },
  {
    title: 'Email Spoofing',
    badge: 'AUTHENTICATION',
    icon: ShieldAlert,
    color: 'text-rose-600',
    desc: 'Analyzes raw headers for SPF, DKIM, and DMARC alignment mismatches to catch forged sender identities.',
    indicators: ['Header anomalies', 'Mismatched envelope-from', 'Relay spoofing'],
  },
  {
    title: 'Executive Impersonation',
    badge: 'EXECUTIVE SAFETY',
    icon: UserX,
    color: 'text-purple-600',
    desc: 'Detects display name manipulation and lookalike mailbox domains impersonating C-suite executives and VIPs.',
    indicators: ['Display name spoofing', 'Cousin domains', 'Urgency vectors'],
  },
  {
    title: 'Business Email Compromise (BEC)',
    badge: 'ACCOUNT TAKEOVER',
    icon: Briefcase,
    color: 'text-blue-600',
    desc: 'Uncovers hijacked vendor threads, invoice modifications, and malicious payroll redirection requests.',
    indicators: ['Thread hijacking', 'Invoice tampering', 'Banking change requests'],
  },
  {
    title: 'Malware & Suspicious Links',
    badge: 'PAYLOAD ANALYSIS',
    icon: FileWarning,
    color: 'text-indigo-600',
    desc: 'Disassembles weaponized attachments (PDFs, macros, ISOs) and analyzes multi-redirect URL execution chains.',
    indicators: ['Hidden macro code', 'Multi-hop redirects', 'Suspicious MIME types'],
  },
  {
    title: 'Financial & Wire Fraud',
    badge: 'FINANCIAL DEFENSE',
    icon: CircleDollarSign,
    color: 'text-emerald-600',
    desc: 'Flags high-pressure extortion demands, fraudulent ACH routing numbers, and gift card coercion tactics.',
    indicators: ['Routing number validation', 'Extortion keywords', 'Payment bypass'],
  },
]

export const ThreatDetection: React.FC = () => {
  return (
    <section id="detection" className="py-24 px-5 sm:px-8 bg-[#FAF9F6] border-b border-[#192837]/6">
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <ScrollReveal delay={0.05}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#7342E2] bg-[#7342E2]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Core Threat Vector Coverage
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#192837] tracking-tight mb-4">
              Comprehensive Email Threat Detection
            </h2>
            <p className="font-body text-base text-[#192837]/75 leading-relaxed">
              CyberTrace intercepts advanced cyberattacks targeting corporate inboxes using multi-layer heuristic
              scoring, NLP intent extraction, and real-time threat intelligence.
            </p>
          </div>
        </ScrollReveal>

        {/* 6 Threat Cards using unified Card component */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {threats.map((t, idx) => {
            const Icon = t.icon
            return (
              <ScrollReveal key={t.title} delay={0.08 * idx} yOffset={36} scaleStart={0.94}>
                <Card
                  badge={t.badge}
                  title={t.title}
                  description={t.desc}
                  className="p-7 text-left"
                >
                  <div className="pt-4 border-t border-[#192837]/8 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#192837]/50">
                        Key Indicators
                      </span>
                      <div className={`p-1.5 rounded-lg bg-[#FAF9F6] ${t.color}`}>
                        <Icon size={16} />
                      </div>
                    </div>
                    {t.indicators.map((ind) => (
                      <div key={ind} className="flex items-center gap-2 text-xs text-[#192837]/85 font-medium">
                        <CheckCircle size={13} className="text-[#7342E2] shrink-0" />
                        <span>{ind}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ThreatDetection
