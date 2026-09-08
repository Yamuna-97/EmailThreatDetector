import React from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Sparkles,
  ChevronDown,
  LogIn,
} from 'lucide-react'
import MaskedHeading from './MaskedHeading'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'

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

export interface HeroProps {
  onOpenAuth?: (mode: 'signin' | 'signup') => void
}

export const Hero: React.FC<HeroProps> = ({ onOpenAuth }) => {
  return (
    <section className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-[#050505]">
      {/* 1. Only Fullscreen Video Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-45"
        >
          <source src={VIDEO_URL} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Subtle dark gradient scrim ensuring crisp left-side typography while revealing video */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 md:via-[#050505]/70 to-transparent pointer-events-none z-1" />
        {/* Subtle red ambient glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#E50914]/10 rounded-full blur-3xl pointer-events-none z-1" />
      </div>

      {/* 2. Hero Content Container */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-12 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl flex flex-col items-start text-left">
          {/* Eyebrow */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariant}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111111]/90 backdrop-blur-md border border-[#E50914]/30 shadow-xs mb-4"
          >
            <Sparkles size={14} className="text-[#FF1E2D]" />
            <span className="font-mono text-xs font-bold tracking-wider uppercase text-[#FF1E2D]">
              AI-POWERED EMAIL THREAT FORENSICS
            </span>
          </motion.div>

          {/* BIG MASKED HEADING */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariant}
            className="w-full mb-4"
          >
            <MaskedHeading
              text="Lock Down Your Inbox with Enterprise Cyber Defense"
              mediaType="video"
              src={VIDEO_URL}
              fillScale={1.35}
              parallax={36}
              drift={18}
              reveal="rise"
              trigger="view"
              align="left"
              weight={900}
              textScale={0.095}
              colorful={true}
              className="font-heading select-none drop-shadow-md text-[#F5F5F5]"
            />
          </motion.div>

          {/* Little Description */}
          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariant}
            className="font-body text-base sm:text-lg text-[#A3A3A3] font-normal leading-relaxed max-w-xl mb-8"
          >
            AI-Powered Email Threat Detection, Geolocation and Forensic Intelligence Platform. Intercept zero-day phishing, executive impersonation, and fraudulent infrastructure before they reach you.
          </motion.p>

          {/* CTAs: Start Now & Sign In */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariant}
            className="flex flex-wrap items-center gap-4 mb-8"
          >
            <InteractiveHoverButton
              text="Start Free Triage"
              onClick={() => onOpenAuth ? onOpenAuth('signup') : null}
              className="w-44 py-3.5 text-sm font-bold bg-[#E50914] text-white border-[#E50914] shadow-xl shadow-[#E50914]/35 hover:bg-[#FF1E2D]"
            />

            <InteractiveHoverButton
              text="Sign In"
              icon={<LogIn size={15} className="text-[#FF1E2D]" />}
              onClick={() => onOpenAuth ? onOpenAuth('signin') : null}
              className="w-36 py-3.5 text-sm font-bold bg-[#181818] text-[#F5F5F5] border-[#2A2A2A] hover:border-[#E50914] shadow-sm"
            />
          </motion.div>

          {/* Live Engine Status Badge */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariant}
            className="flex items-center gap-3.5 py-2.5 px-4 rounded-2xl bg-[#111111]/90 backdrop-blur-md border border-[#2A2A2A] shadow-xs"
          >
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#F5F5F5]">
                REAL-TIME PROTECTION ACTIVE
              </span>
              <span className="text-[11px] text-[#A3A3A3] font-medium">
                FastAPI SOC Engine • Live Threat Telemetry
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3. Bottom Scroll Indicator */}
      <div className="relative z-10 w-full pb-6 text-center">
        <a
          href="#overview"
          className="inline-flex flex-col items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-widest text-[#737373] hover:text-[#FF1E2D] transition-colors cursor-pointer"
        >
          <span>Scroll to explore platform</span>
          <ChevronDown size={16} className="animate-bounce" />
        </a>
      </div>
    </section>
  )
}

export default Hero
