import React from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export const FinalCTA: React.FC = () => {
  return (
    <section id="cta" className="py-24 px-5 sm:px-8 bg-white border-b border-[#192837]/6">
      <div className="max-w-[1280px] mx-auto">
        <div className="relative rounded-3xl p-10 sm:p-16 bg-[#192837] text-white text-center overflow-hidden shadow-2xl">
          {/* Subtle Glow Backdrop */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#7342E2]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider text-[#a78bfa] mb-6 border border-white/10">
              <ShieldCheck size={15} />
              <span>Enterprise Initiative</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
              Your Inbox Shouldn't Be Your Weakest Link.
            </h2>

            <p className="font-body text-base sm:text-lg text-gray-300 leading-relaxed mb-8 max-w-2xl">
              Detect, investigate and respond to email threats before they become real-world attacks.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#detection"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-semibold text-white bg-[#7342E2] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#7342E2]/30"
              >
                <span>Protect My Inbox</span>
                <ArrowRight size={16} />
              </a>

              <a
                href="#dashboard"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full text-sm font-semibold text-white bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 transition-all"
              >
                <span>Explore VaultShield</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FinalCTA
