import React from 'react'
import ScrollExpand from './ScrollExpand'
import MaskedHeading from './MaskedHeading'
import { ShieldCheck, ArrowDown } from 'lucide-react'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4'

export const VideoEntrance: React.FC = () => {
  return (
    <section className="relative w-full bg-[#050505] border-b border-[#2A2A2A] overflow-hidden">
      <ScrollExpand
        src={VIDEO_URL}
        mediaType="video"
        title="CyberTrace"
        scrollHint="Scroll to expand video"
        useWindowScroll={true}
        startWidth={48}
        startHeight={64}
        startRadius={28}
        endRadius={0}
        mediaZoom={1.3}
        scrollDistance={1.0}
        holdDistance={0.3}
        smoothing={0.1}
        overlayScrim={0.5}
        className="w-full"
      >
        {/* Overlay content that smoothly fades in once the video expands to full bleed */}
        <div className="w-full max-w-4xl mx-auto px-6 flex flex-col items-center text-center z-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs font-mono font-bold uppercase tracking-widest text-[#FF1E2D] mb-6 border border-[#FF1E2D]/40 shadow-lg shadow-[#FF1E2D]/20">
            <ShieldCheck size={15} />
            <span>Cyber Defense Platform</span>
          </div>

          <div className="w-full max-w-2xl mb-4">
            <MaskedHeading
              text="Next-Gen Email Defense"
              mediaType="video"
              src={VIDEO_URL}
              fillScale={1.35}
              parallax={36}
              drift={18}
              reveal="rise"
              trigger="view"
              weight={800}
              className="font-heading drop-shadow-md text-white"
            />
          </div>

          <p className="font-body text-base sm:text-lg text-white/90 leading-relaxed max-w-xl mb-8 drop-shadow-sm">
            AI-Powered Email Threat Detection, Geolocation & Forensic Intelligence.
          </p>

          <a
            href="#hero-content"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-[#E50914] hover:bg-[#FF1E2D] active:scale-95 shadow-xl shadow-[#E50914]/30 transition-all cursor-pointer"
          >
            <span>Explore Platform</span>
            <ArrowDown size={16} />
          </a>
        </div>
      </ScrollExpand>
    </section>
  )
}

export default VideoEntrance
