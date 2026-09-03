import React from 'react'
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
  ArrowRight,
} from 'lucide-react'

const steps = [
  { step: '01', title: 'Gmail OAuth', desc: 'Secure enterprise authentication with minimal read-only scope permissions.', icon: KeyRound, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { step: '02', title: 'Gmail API Ingestion', desc: 'Real-time webhook and push subscription listeners stream inbound messages.', icon: CloudLightning, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { step: '03', title: 'Email Extraction', desc: 'Separates raw RFC-822 headers, HTML/plain MIME parts, and file attachments.', icon: FileCode, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  { step: '04', title: 'Header & Content Analysis', desc: 'Parses SPF, DKIM, DMARC, Return-Path, and analyzes embedded HTML URLs.', icon: ScanEye, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { step: '05', title: 'AI / NLP Detection', desc: 'Gemini AI and transformer models evaluate psychological urgency and intent.', icon: Brain, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { step: '06', title: 'IP & Domain Intelligence', desc: 'Queries IPQualityScore, WHOIS, DNS records, and active blocklist feeds.', icon: Radar, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { step: '07', title: 'Geolocation Mapping', desc: 'Identifies sender origin country, city, ASN, and flags Tor/VPN proxy relays.', icon: MapPin, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { step: '08', title: 'Dynamic Risk Engine', desc: 'Calculates a multi-variable 0–100 threat score based on aggregated findings.', icon: Gauge, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { step: '09', title: 'Forensic Intelligence', desc: 'Archives structured evidence dossiers with verifiable chain-of-custody artifacts.', icon: FolderLock, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { step: '10', title: 'Immediate User Warning', desc: 'Injects in-inbox alert banners and triggers automated quarantine rules.', icon: BellRing, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
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

        {/* 10-Step Workflow Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((s, idx) => {
            const Icon = s.icon
            return (
              <div
                key={s.step}
                className="p-5 rounded-3xl bg-white border border-[#192837]/8 shadow-sm hover:shadow-md hover:border-[#7342E2]/30 transition-all duration-200 flex flex-col justify-between text-left group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-2xl border ${s.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-xs font-extrabold text-[#7342E2] bg-[#7342E2]/10 px-2 py-0.5 rounded-full font-mono">
                      {s.step}
                    </span>
                  </div>

                  <h3 className="font-heading text-sm font-bold text-[#192837] mb-2 group-hover:text-[#7342E2] transition-colors">
                    {s.title}
                  </h3>
                  <p className="font-body text-xs text-[#192837]/70 leading-relaxed">{s.desc}</p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="pt-4 mt-2 border-t border-[#192837]/6 flex items-center justify-end text-[#7342E2] text-xs font-semibold">
                    <ArrowRight size={14} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
