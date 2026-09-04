import React from 'react'
import { Shield, Brain, Globe, Lock, Cpu, CheckCircle2, Award, Zap } from 'lucide-react'
import ScrollReveal from './ScrollReveal'

export const About: React.FC = () => {
  return (
    <section id="about" className="py-24 px-5 sm:px-8 bg-white border-b border-[#D8C8FF]">
      <div className="max-w-[1280px] mx-auto">
        <ScrollReveal delay={0.05}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#7342E2] bg-[#F5F3FF] border border-[#D8C8FF] px-4 py-1.5 rounded-full inline-block mb-3">
              About VaultShield
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#1F1F29] tracking-tight mb-4">
              Autonomous Email Threat Intelligence & Forensic Defense
            </h2>
            <p className="font-body text-base text-[#6B7280] leading-relaxed">
              VaultShield is an enterprise cybersecurity intelligence platform engineered to intercept sophisticated email attacks, credential harvesting campaigns, business email compromise (BEC), and zero-day phishing vectors with machine-speed precision.
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
                <div className="p-6 rounded-3xl bg-[#FAF8FF] border border-[#D8C8FF] hover:border-[#7342E2] transition-all hover:shadow-md flex flex-col justify-between h-full">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#D8C8FF] flex items-center justify-center text-[#7342E2] shadow-sm mb-4">
                      <Icon size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-[#7342E2] uppercase tracking-wider block mb-1">
                      {pillar.subtitle}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-[#1F1F29] mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-[#6B7280] leading-relaxed font-body">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>

        {/* Mission Statement & Architectural Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#FAF8FF] border border-[#D8C8FF] rounded-3xl p-8 sm:p-12">
          <div className="lg:col-span-7 space-y-5">
            <span className="text-xs font-bold text-[#7342E2] uppercase tracking-wider bg-white border border-[#D8C8FF] px-3.5 py-1 rounded-full inline-block">
              Our Security Mission
            </span>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1F1F29] tracking-tight">
              Bridging the Gap Between Real-Time Email Protection and Deep Forensics
            </h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Traditional email filters rely on static blocklists and signature databases that fail against novel domain permutations and sophisticated AI-generated lure texts. VaultShield combines continuous RFC header inspection with asynchronous threat enrichment, providing instant inbox defense for employees alongside deep forensic telemetry for SOC tier 2 investigators.
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
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-[#1F1F29]">
                  <CheckCircle2 size={16} className="text-[#7342E2] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#D8C8FF] shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] border border-[#D8C8FF] flex items-center justify-center text-[#7342E2]">
                  <Zap size={16} />
                </div>
                <div>
                  <span className="font-bold text-xs text-[#1F1F29] block">99.8% Detection Rate</span>
                  <span className="text-[10px] text-[#6B7280]">AI heuristic evaluation accuracy</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#D8C8FF] shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] border border-[#D8C8FF] flex items-center justify-center text-[#7342E2]">
                  <Cpu size={16} />
                </div>
                <div>
                  <span className="font-bold text-xs text-[#1F1F29] block">&lt; 350ms Ingestion Latency</span>
                  <span className="text-[10px] text-[#6B7280]">Async FastAPI distributed architecture</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#D8C8FF] shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] border border-[#D8C8FF] flex items-center justify-center text-[#7342E2]">
                  <Award size={16} />
                </div>
                <div>
                  <span className="font-bold text-xs text-[#1F1F29] block">Multi-Layer Threat Forensics</span>
                  <span className="text-[10px] text-[#6B7280]">Header, IP, ASN, Tor & Geolocation matrix</span>
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
