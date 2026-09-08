import React from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export const FinalCTA: React.FC = () => {
  return (
    <section id="cta" className="py-24 px-5 sm:px-8 bg-[#050505] border-b border-[#2A2A2A]">
      <div className="max-w-[1280px] mx-auto">
        <div className="relative rounded-3xl p-10 sm:p-16 bg-[#0A0A0A] text-white text-center overflow-hidden shadow-2xl border border-[#2A2A2A]">
          {/* Subtle Crimson Glow Backdrop */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#E50914]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#FF1E2D]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF1E2D]/10 text-xs font-mono font-bold uppercase tracking-wider text-[#FF1E2D] mb-6 border border-[#FF1E2D]/30">
              <ShieldCheck size={15} />
              <span>Enterprise Initiative</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-5xl font-black tracking-tight mb-5 leading-tight text-[#F5F5F5]">
              Your Inbox Shouldn't Be Your Weakest Link.
            </h2>

            <p className="font-body text-base sm:text-lg text-[#A3A3A3] leading-relaxed mb-8 max-w-2xl">
              Detect, investigate and neutralize zero-day email threats before they penetrate your corporate perimeter.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#detection"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-[#E50914] hover:bg-[#FF1E2D] active:scale-95 transition-all shadow-lg shadow-[#E50914]/30"
              >
                <span>Protect My Inbox</span>
                <ArrowRight size={16} />
              </a>

              <a
                href="#dashboard"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-bold uppercase tracking-wider text-[#F5F5F5] bg-[#181818] hover:bg-[#222222] active:scale-95 border border-[#2A2A2A] transition-all"
              >
                <span>Explore CyberTrace SOC</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FinalCTA
