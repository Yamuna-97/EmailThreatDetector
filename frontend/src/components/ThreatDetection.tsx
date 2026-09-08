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
    color: 'text-amber-500',
    desc: 'Deep inspection of malicious hyperlinks, deceptive login pages, and zero-day credential harvesting schemes.',
    indicators: ['Lookalike URLs', 'Fake OAuth dialogs', 'Homograph attacks'],
  },
  {
    title: 'Email Spoofing',
    badge: 'AUTHENTICATION',
    icon: ShieldAlert,
    color: 'text-[#FF1E2D]',
    desc: 'Analyzes raw headers for SPF, DKIM, and DMARC alignment mismatches to catch forged sender identities.',
    indicators: ['Header anomalies', 'Mismatched envelope-from', 'Relay spoofing'],
  },
  {
    title: 'Executive Impersonation',
    badge: 'EXECUTIVE SAFETY',
    icon: UserX,
    color: 'text-[#E50914]',
    desc: 'Detects display name manipulation and lookalike mailbox domains impersonating C-suite executives and VIPs.',
    indicators: ['Display name spoofing', 'Cousin domains', 'Urgency vectors'],
  },
  {
    title: 'Business Email Compromise (BEC)',
    badge: 'ACCOUNT TAKEOVER',
    icon: Briefcase,
    color: 'text-[#A3A3A3]',
    desc: 'Uncovers hijacked vendor threads, invoice modifications, and malicious payroll redirection requests.',
    indicators: ['Thread hijacking', 'Invoice tampering', 'Banking change requests'],
  },
  {
    title: 'Malware & Suspicious Links',
    badge: 'PAYLOAD ANALYSIS',
    icon: FileWarning,
    color: 'text-[#FF5A36]',
    desc: 'Disassembles weaponized attachments (PDFs, macros, ISOs) and analyzes multi-redirect URL execution chains.',
    indicators: ['Hidden macro code', 'Multi-hop redirects', 'Suspicious MIME types'],
  },
  {
    title: 'Financial & Wire Fraud',
    badge: 'FINANCIAL DEFENSE',
    icon: CircleDollarSign,
    color: 'text-emerald-500',
    desc: 'Flags high-pressure extortion demands, fraudulent ACH routing numbers, and gift card coercion tactics.',
    indicators: ['Routing number validation', 'Extortion keywords', 'Payment bypass'],
  },
]

export const ThreatDetection: React.FC = () => {
  return (
    <section id="detection" className="py-24 px-5 sm:px-8 bg-[#050505] border-b border-[#2A2A2A]">
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <ScrollReveal delay={0.05}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF1E2D] bg-[#E50914]/12 border border-[#E50914]/30 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Core Threat Vector Coverage
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight mb-4">
              Comprehensive Email Threat Detection
            </h2>
            <p className="font-body text-base text-[#A3A3A3] leading-relaxed">
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
                  <div className="pt-4 border-t border-[#2A2A2A] space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
                        Key Indicators
                      </span>
                      <div className={`p-1.5 rounded-lg bg-[#181818] border border-[#2A2A2A] ${t.color}`}>
                        <Icon size={16} />
                      </div>
                    </div>
                    {t.indicators.map((ind) => (
                      <div key={ind} className="flex items-center gap-2 text-xs text-[#A3A3A3] font-medium">
                        <CheckCircle size={13} className="text-[#FF1E2D] shrink-0" />
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
