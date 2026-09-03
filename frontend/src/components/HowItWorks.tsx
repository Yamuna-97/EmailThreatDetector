import React from 'react'
import Card from './Card'
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
    <section id="how-it-works" className="py-24 px-5 sm:px-8 bg-[#FAF9F6] border-b border-[#192837]/6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#7342E2] bg-[#7342E2]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Execution Flow Pipeline
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#192837] tracking-tight mb-4">
            How VaultShield Operates End-to-End
          </h2>
          <p className="font-body text-base text-[#192837]/75 leading-relaxed">
            From initial OAuth inbox connection to forensic timeline generation, discover the 10-stage automated workflow
            that powers our SIH 2026 platform.
          </p>
        </div>

        {/* 10-Step Workflow Grid using unified Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((s) => {
            const Icon = s.icon
            return (
              <Card
                key={s.step}
                badge={`STEP ${s.step}`}
                title={s.title}
                description={s.desc}
                className="p-5 text-left flex flex-col justify-between"
              >
                <div className="pt-3 border-t border-[#192837]/6 flex justify-end">
                  <div className="p-2 rounded-xl bg-[#FAF9F6] text-[#7342E2]">
                    <Icon size={18} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
