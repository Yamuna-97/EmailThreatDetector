import React from 'react'
import SpotlightCard from './SpotlightCard'
import {
  Mail,
  Brain,
  ShieldCheck,
  Globe,
  Zap,
  Lock,
  Radar,
} from 'lucide-react'

const techs = [
  { name: 'Gmail API', role: 'Real-time Message Ingestion', desc: 'Secure Google Workspace pub/sub hooks for continuous inbox telemetry.', icon: Mail, color: 'text-red-600 bg-red-50' },
  { name: 'Gemini AI', role: 'Advanced Semantic Reasoning', desc: 'Transformer LLMs for context-aware NLP threat intent extraction and classification.', icon: Brain, color: 'text-purple-600 bg-purple-50' },
  { name: 'IPQualityScore', role: 'Reputation & Fraud Scoring', desc: 'Global blacklist verification and honeypot correlation for high-accuracy scoring.', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
  { name: 'IP Geolocation', role: 'MaxMind GeoIP2 Telemetry', desc: 'Physical city, country, and ASN traceroute resolution for forensic clues.', icon: Globe, color: 'text-blue-600 bg-blue-50' },
  { name: 'FastAPI Backend', role: 'High-Throughput Microservice', desc: 'Asynchronous Python architecture handling thousands of email requests per second.', icon: Zap, color: 'text-teal-600 bg-teal-50' },
  { name: 'Secure OAuth 2.0', role: 'Zero Trust Authorization', desc: 'Minimal-privilege token access adhering to Google Cloud security standards.', icon: Lock, color: 'text-indigo-600 bg-indigo-50' },
  { name: 'Threat Intelligence', role: 'Multi-Feed IOC Clustering', desc: 'Aggregates Spamhaus, AbuseIPDB, and Tor directory node lists continuously.', icon: Radar, color: 'text-amber-600 bg-amber-50' },
]

export const TechStack: React.FC = () => {
  return (
    <section id="tech" className="py-24 px-5 sm:px-8 bg-[#FAF9F6] border-b border-[#192837]/6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#7342E2] bg-[#7342E2]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Enterprise-Grade Foundation
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#192837] tracking-tight mb-4">
            Built with Trusted AI & Security Technologies
          </h2>
          <p className="font-body text-base text-[#192837]/75 leading-relaxed">
            VaultShield integrates industry-standard APIs, advanced LLM reasoning, and low-latency microservices
            engineered for SIH 2026.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {techs.map((t) => {
            const Icon = t.icon
            return (
              <SpotlightCard
                key={t.name}
                spotlightColor="rgba(115, 66, 226, 0.14)"
                className="p-6 rounded-3xl bg-white border border-[#192837]/8 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-2xl ${t.color}`}>
                      <Icon size={20} />
                    </div>
                  </div>
                  <h3 className="font-heading text-base font-bold text-[#192837] mb-1">{t.name}</h3>
                  <div className="text-xs font-semibold text-[#7342E2] mb-2">{t.role}</div>
                  <p className="font-body text-xs text-[#192837]/70 leading-relaxed">{t.desc}</p>
                </div>
              </SpotlightCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default TechStack
