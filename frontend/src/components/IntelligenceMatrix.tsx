import React from 'react'
import MagicBento from './MagicBento'
import ScrollReveal from './ScrollReveal'

export const IntelligenceMatrix: React.FC = () => {
  return (
    <section className="py-24 px-5 sm:px-8 bg-[#050505] border-b border-[#2A2A2A]">
      <div className="max-w-[1280px] mx-auto">
        <ScrollReveal delay={0.05}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF1E2D] bg-[#E50914]/12 border border-[#E50914]/30 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Interactive Intelligence Matrix
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight mb-4">
              Unified Threat Intelligence Matrix
            </h2>
            <p className="font-body text-base text-[#A3A3A3] leading-relaxed">
              Explore CyberTrace's interactive neural defense modules with real-time 3D cursor magnetism, particle sparks,
              and dynamic red telemetry spotlight tracing.
            </p>
          </div>
        </ScrollReveal>

        {/* MagicBento Grid with Red & Black Light */}
        <ScrollReveal delay={0.15} yOffset={40} scaleStart={0.94}>
          <MagicBento
            enableStars={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            glowColor="229, 9, 20"
            particleCount={10}
          />
        </ScrollReveal>
      </div>
    </section>
  )
}

export default IntelligenceMatrix
