import React from 'react'
import { motion, type Variants } from 'framer-motion'
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
  ShieldCheck,
} from 'lucide-react'
import TextType from './TextType'
import MaskedHeading from './MaskedHeading'
import ScrollExpand from './ScrollExpand'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4'

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

const pipelineSteps = [
  { label: 'Email Ingestion', sub: 'Gmail OAuth API', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  { label: 'AI Analysis', sub: 'Gemini & NLP', icon: Cpu, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  { label: 'Threat Intel', sub: 'IPQualityScore', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { label: 'GeoLocation', sub: 'IP & ASN Trace', icon: Globe2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { label: 'Risk Score', sub: 'Critical / Safe', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
]

export const Hero: React.FC = () => {
  return (
    <section className="relative w-full overflow-hidden bg-[#FFFFFF] pb-20 border-b border-[#192837]/6">
      {/* 1. Full-Page Expandable Video Entrance using ScrollExpand */}
      <div className="w-full min-h-[70vh] sm:min-h-[85vh] lg:min-h-[92vh] relative bg-[#FAF9F6]">
        <ScrollExpand
          src={VIDEO_URL}
          mediaType="video"
          title=""
          scrollHint="Scroll to expand threat detection stage"
          startWidth={88}
          startHeight={80}
          startRadius={32}
          endRadius={0}
          mediaZoom={1.2}
          scrollDistance={0.8}
          useWindowScroll={true}
          className="w-full h-full"
        >
          {/* Content that overlays smoothly over the full-bleed video */}
          <div className="w-full max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 text-left">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-[#7342E2] mb-4 shadow-sm border border-white/40">
                <ShieldCheck size={14} />
                <span>Next-Gen Forensic Intelligence</span>
              </div>
              <div className="w-full mb-3">
                <MaskedHeading
                  text="VaultShield Security"
                  mediaType="video"
                  src={VIDEO_URL}
                  fillScale={1.3}
                  parallax={32}
                  drift={16}
                  reveal="rise"
                  trigger="view"
                  align="left"
                  weight={800}
                  textScale={0.09}
                  className="font-heading drop-shadow-sm"
                />
              </div>
              <p className="text-sm sm:text-base text-[#192837] font-semibold bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-sm leading-relaxed">
                AI-Powered Email Threat Detection, Geolocation & Forensic Intelligence Platform built for SIH 2026.
              </p>
            </div>

            <div className="hidden lg:flex flex-col gap-3 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-xl max-w-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-[#7342E2]">Live Engine Status</div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#192837]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>FastAPI Webhook: Connected</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#192837]">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Gemini AI Engine: Active</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#192837]">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>GeoIP Tracer: Sub-50ms</span>
              </div>
            </div>
          </div>
        </ScrollExpand>
      </div>

      {/* 2. Main Hero Information & Interactive Layout */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Hero Copy & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Eyebrow */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7342E2]/10 border border-[#7342E2]/20 mb-5"
            >
              <Sparkles size={14} className="text-[#7342E2]" />
              <span className="text-xs font-bold tracking-wider uppercase text-[#7342E2]">
                AI-POWERED EMAIL SECURITY
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#192837] tracking-tight leading-[1.08] mb-4"
            >
              Stop Threats Before They Reach You.
            </motion.h1>

            {/* Dynamic TextType Telemetry Line */}
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              className="text-base sm:text-lg font-semibold text-[#7342E2] mb-4 min-h-[28px] flex items-center gap-1.5"
            >
              <ShieldAlert size={18} className="text-[#7342E2] shrink-0" />
              <TextType
                text={[
                  'Detecting zero-day phishing in milliseconds...',
                  'Unmasking CEO spoofing and impersonation...',
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
            </motion.div>

            {/* Description */}
            <motion.p
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              className="font-body text-base sm:text-lg text-[#192837]/80 leading-relaxed max-w-2xl mb-8"
            >
              VaultShield detects phishing, impersonation, business email compromise, malicious emails and suspicious
              email infrastructure using AI and threat intelligence. Built for real-time inbox surveillance and forensic triage.
            </motion.p>

            {/* CTA Action Buttons */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              className="flex flex-wrap items-center gap-4 mb-10"
            >
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
            </motion.div>

            {/* Live Security Status Badge */}
            <motion.div
              custom={5}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              className="flex items-center gap-4 py-3 px-5 rounded-2xl bg-[#F7F6F3] border border-[#192837]/10 shadow-sm"
            >
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute" />
                <span className="w-3 h-3 rounded-full bg-emerald-600 relative" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-[#192837]">
                  REAL-TIME PROTECTION
                </span>
                <span className="text-xs text-[#192837]/70 font-medium">
                  Threat intelligence active • SIH 2026 Engine
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Live Threat Telemetry Visual Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl p-6 sm:p-8 bg-white border border-[#192837]/10 shadow-2xl shadow-[#192837]/5">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[#192837]/10 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#7342E2]/10 text-[#7342E2]">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#192837]">Inbox Threat Shield</h3>
                    <p className="text-[11px] text-[#192837]/60">AI Heuristics & Geo-Telemetry</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-100 text-rose-700 border border-rose-200">
                  Critical Risk (94%)
                </span>
              </div>

              {/* Sample Email Details */}
              <div className="space-y-3.5 mb-6">
                <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#192837]/8 text-left">
                  <div className="text-[11px] font-semibold text-[#192837]/60 uppercase tracking-wide mb-1">
                    Analyzed Subject
                  </div>
                  <div className="text-xs font-bold text-[#192837]">
                    URGENT: Verify Wire Transfer to Offshore Vendor #9021
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#192837]/8">
                    <span className="text-[10px] text-[#192837]/60 font-medium">Spoofed Sender</span>
                    <p className="text-xs font-semibold text-rose-600 truncate">ceo@company-corp.com</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#192837]/8">
                    <span className="text-[10px] text-[#192837]/60 font-medium">Origin Geolocation</span>
                    <p className="text-xs font-semibold text-[#192837] truncate">🇷🇺 St. Petersburg (Tor)</p>
                  </div>
                </div>
              </div>

              {/* Indicators List */}
              <div className="space-y-2 text-left mb-6">
                <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-rose-50 text-rose-800">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldAlert size={14} /> SPF / DKIM Authentication Failed
                  </span>
                  <span className="font-bold">FAIL</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-amber-50 text-amber-800">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Activity size={14} /> High-Pressure Financial Intent
                  </span>
                  <span className="font-bold">98%</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-purple-50 text-purple-800">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={14} /> Forensic Evidence Captured
                  </span>
                  <span className="font-bold">READY</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#192837]/10 flex items-center justify-between text-xs text-[#192837]/70">
                <span>FastAPI Backend Active</span>
                <span className="font-semibold text-[#7342E2]">Zero-Day Quarantine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Pipeline Visualization */}
        <div className="mt-16 pt-12 border-t border-[#192837]/10">
          <div className="text-center mb-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#7342E2] bg-[#7342E2]/10 px-3 py-1 rounded-full">
              Automated Defense Pipeline
            </span>
            <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#192837] mt-2">
              End-to-End Threat Detection Architecture
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon
              return (
                <div
                  key={step.label}
                  className={`relative p-4 rounded-2xl border ${step.bg} text-left transition-transform hover:-translate-y-1 duration-200 shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-xl bg-white shadow-xs ${step.color}`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-[#192837]/40 uppercase font-mono">
                      Step 0{idx + 1}
                    </span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#192837] mb-0.5">{step.label}</h4>
                  <p className="text-xs text-[#192837]/70">{step.sub}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
