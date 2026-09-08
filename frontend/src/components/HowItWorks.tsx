import React from 'react'
import Card from './Card'
import ScrollReveal from './ScrollReveal'
import {
  KeyRound,
  CloudLightning,
  FileCode,
  ScanEye,
  Brain,
  Radar,
  MapPin,
  Gauge,
  FolderLock,
  BellRing,
} from 'lucide-react'

const steps = [
  { step: '01', title: 'Gmail OAuth', desc: 'Secure enterprise authentication with minimal read-only scope permissions.', icon: KeyRound },
  { step: '02', title: 'Gmail API Ingestion', desc: 'Real-time webhook and push subscription listeners stream inbound messages.', icon: CloudLightning },
  { step: '03', title: 'Email Extraction', desc: 'Separates raw RFC-822 headers, HTML/plain MIME parts, and file attachments.', icon: FileCode },
  { step: '04', title: 'Header & Content Analysis', desc: 'Parses SPF, DKIM, DMARC, Return-Path, and analyzes embedded HTML URLs.', icon: ScanEye },
  { step: '05', title: 'AI / NLP Detection', desc: 'Gemini AI and transformer models evaluate psychological urgency and intent.', icon: Brain },
  { step: '06', title: 'IP & Domain Intelligence', desc: 'Queries IPQualityScore, WHOIS, DNS records, and active blocklist feeds.', icon: Radar },
  { step: '07', title: 'Geolocation Mapping', desc: 'Identifies sender origin country, city, ASN, and flags Tor/VPN proxy relays.', icon: MapPin },
  { step: '08', title: 'Dynamic Risk Engine', desc: 'Calculates a multi-variable 0–100 threat score based on aggregated findings.', icon: Gauge },
  { step: '09', title: 'Forensic Intelligence', desc: 'Archives structured evidence dossiers with verifiable chain-of-custody artifacts.', icon: FolderLock },
  { step: '10', title: 'Immediate User Warning', desc: 'Injects in-inbox alert banners and triggers automated quarantine rules.', icon: BellRing },
]

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 px-5 sm:px-8 bg-[#050505] border-b border-[#2A2A2A]">
      <div className="max-w-[1280px] mx-auto">
        <ScrollReveal delay={0.05}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF1E2D] bg-[#FF1E2D]/10 border border-[#FF1E2D]/20 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Execution Flow Pipeline
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight mb-4">
              How CyberTrace Operates End-to-End
            </h2>
            <p className="font-body text-base text-[#A3A3A3] leading-relaxed">
              From initial OAuth inbox connection to forensic timeline generation, discover the 10-stage automated workflow
              that powers our cyber defense platform.
            </p>
          </div>
        </ScrollReveal>

        {/* 10-Step Workflow Grid using unified Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((s, idx) => {
            const Icon = s.icon
            return (
              <ScrollReveal key={s.step} delay={0.06 * idx} yOffset={30} scaleStart={0.94}>
                <Card
                  badge={`STEP ${s.step}`}
                  title={s.title}
                  description={s.desc}
                  className="p-5 text-left flex flex-col justify-between hover:border-[#FF1E2D]/40"
                >
                  <div className="pt-3 border-t border-[var(--border-primary)] flex justify-end">
                    <div className="p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-primary)] text-[#FF1E2D]">
                      <Icon size={18} />
                    </div>
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

export default HowItWorks
