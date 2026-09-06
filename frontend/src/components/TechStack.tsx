import React from 'react'
import Card from './Card'
import ScrollReveal from './ScrollReveal'
import {
  Mail,
  Brain,
  ShieldCheck,
  Globe,
  Zap,
  Lock,
  Radar,
  Server,
} from 'lucide-react'

const techs = [
  { name: 'Gmail API', badge: 'INGESTION', role: 'Real-time Message Ingestion', desc: 'Secure Google Workspace pub/sub hooks for continuous inbox telemetry.', icon: Mail },
  { name: 'Gemini AI', badge: 'INTELLIGENCE', role: 'Advanced Semantic Reasoning', desc: 'Transformer LLMs for context-aware NLP threat intent extraction and classification.', icon: Brain },
  { name: 'IPQualityScore', badge: 'FRAUD SCORES', role: 'Reputation & Scoring', desc: 'Global blacklist verification and honeypot correlation for high-accuracy scoring.', icon: ShieldCheck },
  { name: 'IP Geolocation', badge: 'TELEMETRY', role: 'MaxMind GeoIP2', desc: 'Physical city, country, and ASN traceroute resolution for forensic clues.', icon: Globe },
  { name: 'FastAPI Backend', badge: 'MICROSERVICES', role: 'High-Throughput Core', desc: 'Asynchronous Python architecture handling thousands of email requests per second.', icon: Zap },
  { name: 'Secure OAuth 2.0', badge: 'ZERO TRUST', role: 'Zero Trust Authorization', desc: 'Minimal-privilege token access adhering to Google Cloud security standards.', icon: Lock },
  { name: 'Threat Intelligence', badge: 'IOC FEEDS', role: 'Multi-Feed Clustering', desc: 'Aggregates Spamhaus, AbuseIPDB, and Tor directory node lists continuously.', icon: Radar },
  { name: 'Forensic Storage', badge: 'AUDIT TRAILS', role: 'Verifiable Evidence Vault', desc: 'Immutable JSON and PDF export dossiers with RFC-compliant cryptographic hashes.', icon: Server },
]

export const TechStack: React.FC = () => {
  return (
    <section id="tech" className="py-24 px-5 sm:px-8 bg-[#FAF9F6] border-b border-[#192837]/6">
      <div className="max-w-[1280px] mx-auto">
        <ScrollReveal delay={0.05}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#7342E2] bg-[#7342E2]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Enterprise-Grade Foundation
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#192837] tracking-tight mb-4">
              Built with Trusted AI & Security Technologies
            </h2>
            <p className="font-body text-base text-[#192837]/75 leading-relaxed">
              CyberTrace integrates industry-standard APIs, advanced LLM reasoning, and low-latency microservices
              engineered for enterprise-scale cyber defense.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {techs.map((t, idx) => {
            const Icon = t.icon
            return (
              <ScrollReveal key={t.name} delay={0.06 * idx} yOffset={25} scaleStart={0.94}>
                <Card
                  badge={t.badge}
                  title={t.name}
                  description={t.desc}
                  className="p-6 text-left"
                >
                  <div className="pt-3 border-t border-[#192837]/8 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#7342E2]">{t.role}</span>
                    <div className="p-2 rounded-xl bg-[#FAF9F6] text-[#7342E2]">
                      <Icon size={16} />
                    </div>
                  </div>
                </Card>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default TechStack
