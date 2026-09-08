import React from 'react'
import { Shield, Brain, Globe, Lock, Cpu, CheckCircle2, Award, Zap } from 'lucide-react'
import ScrollReveal from './ScrollReveal'

export const About: React.FC = () => {
  return (
    <section id="about" className="py-24 px-5 sm:px-8 bg-[#050505] border-b border-[#2A2A2A]">
      <div className="max-w-[1280px] mx-auto">
        <ScrollReveal delay={0.05}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF1E2D] bg-[#E50914]/12 border border-[#E50914]/30 px-4 py-1.5 rounded-full inline-block mb-3">
              About CyberTrace
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight mb-4">
              Autonomous Email Threat Intelligence & Forensic Defense
            </h2>
            <p className="font-body text-base text-[#A3A3A3] leading-relaxed">
              CyberTrace is an enterprise cybersecurity intelligence platform engineered to intercept sophisticated email attacks, credential harvesting campaigns, business email compromise (BEC), and zero-day phishing vectors with machine-speed precision.
            </p>
          </div>
        </ScrollReveal>

        {/* 4 Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            {
              icon: Brain,
              title: 'Cognitive AI Analysis',
              subtitle: 'Gemini NLP Engine',
              desc: 'Deep semantic and linguistic intent inspection detecting urgent coercion, VIP impersonation, and zero-day spear phishing.',
            },
            {
              icon: Lock,
              title: 'MIME Forensic Auth',
              subtitle: 'SPF / DKIM / DMARC',
              desc: 'Cryptographic validation of sender authenticity, return-path consistency, and anti-spoofing policy enforcement.',
            },
            {
              icon: Globe,
              title: 'BGP & IP Intelligence',
              subtitle: 'IPQualityScore & Geo',
              desc: 'Live proxy, VPN, and Tor exit node attribution tracing email origin infrastructure back to autonomous system networks (ASNs).',
            },
            {
              icon: Shield,
              title: 'SOC Triage & Dossiers',
              subtitle: 'Court-Admissible Reports',
              desc: 'Automated forensic dossier generation, complete audit trails, and multi-tier investigation workflows for cybersecurity teams.',
            },
          ].map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <ScrollReveal key={pillar.title} delay={0.08 * idx} yOffset={25}>
                <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] hover:border-[#E50914] transition-all hover:shadow-lg hover:shadow-[#E50914]/10 flex flex-col justify-between h-full">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#181818] border border-[#2A2A2A] flex items-center justify-center text-[#FF1E2D] shadow-sm mb-4">
                      <Icon size={24} />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-[#FF1E2D] uppercase tracking-wider block mb-1">
                      {pillar.subtitle}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-[#F5F5F5] mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-[#A3A3A3] leading-relaxed font-body">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>

        {/* Mission Statement & Architectural Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#0A0A0A] border border-[#2A2A2A] rounded-3xl p-8 sm:p-12">
          <div className="lg:col-span-7 space-y-5">
            <span className="font-mono text-xs font-bold text-[#FF1E2D] uppercase tracking-wider bg-[#181818] border border-[#2A2A2A] px-3.5 py-1 rounded-full inline-block">
              Our Security Mission
            </span>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
              Bridging the Gap Between Real-Time Email Protection and Deep Forensics
            </h3>
            <p className="text-sm text-[#A3A3A3] leading-relaxed">
              Traditional email filters rely on static blocklists and signature databases that fail against novel domain permutations and sophisticated AI-generated lure texts. CyberTrace combines continuous RFC header inspection with asynchronous threat enrichment, providing instant inbox defense for employees alongside deep forensic telemetry for SOC tier 2 investigators.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                'Zero-Privilege Google OAuth 2.0 Integration',
                'Sub-Second Heuristic Classification Pipeline',
                'Unified Threat Scoring Algorithm (0-100)',
                'Interactive MapLibre GL Vector Telemetry',
                'Automated PDF Forensic Incident Dossiers',
                'SOC2 & Enterprise Data Privacy Standards',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-[#F5F5F5]">
                  <CheckCircle2 size={16} className="text-[#FF1E2D] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-[#111111] border border-[#2A2A2A] shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#181818] border border-[#2A2A2A] flex items-center justify-center text-[#FF1E2D]">
                  <Zap size={16} />
                </div>
                <div>
                  <span className="font-mono font-bold text-xs text-[#F5F5F5] block">99.8% Detection Rate</span>
                  <span className="text-[10px] text-[#A3A3A3]">AI heuristic evaluation accuracy</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#111111] border border-[#2A2A2A] shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#181818] border border-[#2A2A2A] flex items-center justify-center text-[#FF1E2D]">
                  <Cpu size={16} />
                </div>
                <div>
                  <span className="font-mono font-bold text-xs text-[#F5F5F5] block">&lt; 350ms Ingestion Latency</span>
                  <span className="text-[10px] text-[#A3A3A3]">Async FastAPI distributed architecture</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#111111] border border-[#2A2A2A] shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#181818] border border-[#2A2A2A] flex items-center justify-center text-[#FF1E2D]">
                  <Award size={16} />
                </div>
                <div>
                  <span className="font-mono font-bold text-xs text-[#F5F5F5] block">Multi-Layer Threat Forensics</span>
                  <span className="text-[10px] text-[#A3A3A3]">Header, IP, ASN, Tor & Geolocation matrix</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
