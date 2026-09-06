import React from 'react'
import {
  ShieldAlert,
  ArrowRight,
  Mail,
  Cpu,
  Globe2,
  Activity,
  CheckCircle2,
  Lock,
  Play,
  Sparkles,
  Zap,
  LockKeyhole,
  Fingerprint,
} from 'lucide-react'
import TextType from './TextType'
import Card from './Card'
import ScrollReveal from './ScrollReveal'

const pipelineSteps = [
  { label: 'Email Ingestion', sub: 'Gmail OAuth API', badge: '01', icon: Mail, color: 'text-blue-600' },
  { label: 'AI Analysis', sub: 'Gemini & NLP', badge: '02', icon: Cpu, color: 'text-purple-600' },
  { label: 'Threat Intel', sub: 'IPQualityScore', badge: '03', icon: ShieldAlert, color: 'text-amber-600' },
  { label: 'GeoLocation', sub: 'IP & ASN Trace', badge: '04', icon: Globe2, color: 'text-emerald-600' },
  { label: 'Risk Score', sub: 'Critical / Safe', badge: '05', icon: Activity, color: 'text-rose-600' },
]

export const ThreatOverview: React.FC = () => {
  return (
    <section id="overview" className="relative w-full py-20 sm:py-28 bg-white border-b border-[#192837]/8 overflow-hidden">
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Heading + TextType + Description + CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <ScrollReveal delay={0.05}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7342E2]/10 border border-[#7342E2]/20 mb-5 shadow-xs">
                <Sparkles size={14} className="text-[#7342E2]" />
                <span className="text-xs font-bold tracking-wider uppercase text-[#7342E2]">
                  AI-POWERED EMAIL SECURITY
                </span>
              </div>
            </ScrollReveal>

            {/* Main Heading with inline security icons */}
            <ScrollReveal delay={0.12}>
              <h2 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#192837] tracking-tight leading-[1.08] mb-4">
                <span className="inline-flex items-center">
                  <Zap size={32} className="text-[#192837] inline-block mr-2 -top-[2px] relative" />
                  <span>Stop Threats</span>
                </span>{' '}
                <span className="inline-block">Before</span>{' '}
                <LockKeyhole size={30} className="text-[#192837] inline-block mx-2 -top-[2px] relative" />{' '}
                <span className="inline-block">They Reach You.</span>{' '}
                <Fingerprint size={30} className="text-[#192837] inline-block ml-2 -top-[2px] relative" />
              </h2>
            </ScrollReveal>

            {/* Dynamic TextType Telemetry Line */}
            <ScrollReveal delay={0.18}>
              <div className="text-base sm:text-lg font-semibold text-[#7342E2] mb-4 min-h-[28px] flex items-center gap-2">
                <ShieldAlert size={18} className="text-[#7342E2] shrink-0" />
                <TextType
                  text={[
                    'Detecting zero-day phishing in milliseconds...',
                    'Unmasking CEO spoofing & account takeover...',
                    'Tracing fraudulent IP geolocation & Tor relays...',
                    'Extracting forensically-sound email evidence...',
                  ]}
                  typingSpeed={40}
                  deletingSpeed={25}
                  pauseDuration={2200}
                  showCursor={true}
                  cursorCharacter="|"
                  className="font-medium"
                />
              </div>
            </ScrollReveal>

            {/* Description */}
            <ScrollReveal delay={0.24}>
              <p className="font-body text-base sm:text-lg text-[#192837]/80 leading-relaxed max-w-2xl mb-8">
                CyberTrace detects phishing, impersonation, business email compromise, malicious emails and suspicious
                email infrastructure using AI and threat intelligence. Built for real-time inbox surveillance and forensic triage.
              </p>
            </ScrollReveal>

            {/* CTA Action Buttons */}
            <ScrollReveal delay={0.3}>
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <a
                  href="#detection"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-semibold text-white bg-[#7342E2] hover:brightness-110 active:scale-95 shadow-lg shadow-[#7342E2]/25 transition-all cursor-pointer"
                >
                  <span>Protect My Inbox</span>
                  <ArrowRight size={16} />
                </a>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-[#192837] bg-[#F2F2EE] hover:bg-[#e7e7e2] active:scale-95 border border-[#192837]/10 transition-all shadow-sm cursor-pointer"
                >
                  <Play size={15} className="text-[#7342E2] fill-[#7342E2]" />
                  <span>See How It Works</span>
                </a>
              </div>
            </ScrollReveal>

            {/* Live Security Status Badge */}
            <ScrollReveal delay={0.36}>
              <div className="flex items-center gap-4 py-3 px-5 rounded-2xl bg-[#F7F6F3] border border-[#192837]/10 shadow-sm">
                <div className="relative flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute" />
                  <span className="w-3 h-3 rounded-full bg-emerald-600 relative" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#192837]">
                    REAL-TIME PROTECTION
                  </span>
                  <span className="text-xs text-[#192837]/70 font-medium">
                    Threat intelligence active • Enterprise Engine
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Interactive Telemetry Card */}
          <div className="lg:col-span-5">
            <ScrollReveal delay={0.2} yOffset={45} scaleStart={0.92}>
              <Card
                badge="LIVE THREAT INTERCEPTION"
                title="Inbox Threat Shield"
                description="AI Heuristics & Geo-Telemetry • Critical Risk (94%)"
                className="p-6 sm:p-8 text-left shadow-2xl"
              >
                <div className="space-y-3.5 mb-5 mt-2">
                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#192837]/8">
                    <div className="text-[10px] font-semibold text-[#192837]/60 uppercase tracking-wide mb-1">
                      Analyzed Subject
                    </div>
                    <div className="text-xs font-bold text-[#192837]">
                      URGENT: Verify Wire Transfer to Offshore Vendor #9021
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#192837]/8">
                      <span className="text-[10px] text-[#192837]/60 font-medium block">Spoofed Sender</span>
                      <p className="text-xs font-semibold text-rose-600 truncate">ceo@company-corp.com</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#192837]/8">
                      <span className="text-[10px] text-[#192837]/60 font-medium block">Origin Geolocation</span>
                      <p className="text-xs font-semibold text-[#192837] truncate">🇷🇺 St. Petersburg (Tor)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-100">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ShieldAlert size={14} /> SPF / DKIM Authentication Failed
                    </span>
                    <span className="font-bold">FAIL</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Activity size={14} /> High-Pressure Financial Intent
                    </span>
                    <span className="font-bold">98%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-100">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 size={14} /> Forensic Evidence Captured
                    </span>
                    <span className="font-bold">READY</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#192837]/10 flex items-center justify-between text-xs text-[#192837]/70">
                  <span className="flex items-center gap-1.5 font-semibold text-[#192837]">
                    <Lock size={13} className="text-[#7342E2]" /> FastAPI Backend Active
                  </span>
                  <span className="font-bold text-[#7342E2]">Zero-Day Quarantine</span>
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </div>

        {/* Security Pipeline Visualization */}
        <div className="mt-16 pt-12 border-t border-[#192837]/10">
          <ScrollReveal delay={0.1}>
            <div className="text-center mb-8">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#7342E2] bg-[#7342E2]/10 px-3 py-1 rounded-full">
                Automated Defense Pipeline
              </span>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#192837] mt-2">
                End-to-End Threat Detection Architecture
              </h3>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon
              return (
                <ScrollReveal key={step.label} delay={0.08 * idx} yOffset={30}>
                  <Card
                    badge={`STEP ${step.badge}`}
                    title={step.label}
                    description={step.sub}
                    className="p-5 text-left flex flex-col justify-between"
                  >
                    <div className="pt-3 border-t border-[#192837]/8 flex justify-end">
                      <div className={`p-2 rounded-xl bg-[#FAF9F6] ${step.color}`}>
                        <Icon size={18} />
                      </div>
                    </div>
                  </Card>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ThreatOverview
