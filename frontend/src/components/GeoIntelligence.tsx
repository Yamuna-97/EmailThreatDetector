import React from 'react'
import Card from './Card'
import ScrollReveal from './ScrollReveal'
import {
  Server,
  MapPin,
  ShieldX,
  Radar,
  Network,
  Cpu,
} from 'lucide-react'

const intelMetrics = [
  {
    title: 'Sender IP Analysis',
    badge: 'FLAGGED MALICIOUS',
    value: '185.220.101.44',
    icon: Network,
    details: 'Originates from known bulletproof hosting infrastructure with high fraud scores.',
  },
  {
    title: 'IP Geolocation & City',
    badge: 'HIGH ANOMALY',
    value: 'Frankfurt, Germany (DE)',
    icon: MapPin,
    details: 'Region mismatch: sender claims US executive branch but transmits from European datacenter.',
  },
  {
    title: 'ISP & Autonomous System (ASN)',
    badge: 'VERIFIED ASN',
    value: 'AS200052 • FlokiNET ISP',
    icon: Server,
    details: 'Autonomous system associated with offshore VPS hosting and privacy tunnels.',
  },
  {
    title: 'Proxy / VPN / Tor Detection',
    badge: 'CRITICAL ALERT',
    value: 'Active Tor Exit Node',
    icon: ShieldX,
    details: 'Direct routing through an anonymizing onion proxy to conceal actual physical origin.',
  },
  {
    title: 'IP & Domain Reputation',
    badge: 'BLACKLISTED IN 14 FEEDS',
    value: 'Fraud Score: 98 / 100',
    icon: Radar,
    details: 'Correlated across IPQualityScore, Spamhaus, and AbuseIPDB global threat databases.',
  },
  {
    title: 'Threat Intel Correlation',
    badge: 'CORRELATED INDICATOR',
    value: 'Linked to APT-29 Campaign',
    icon: Cpu,
    details: 'Automated clustering connects infrastructure fingerprints with known cybercrime rings.',
  },
]

export const GeoIntelligence: React.FC = () => {
  return (
    <section id="intelligence" className="py-24 px-5 sm:px-8 bg-[#FAF9F6] border-b border-[#192837]/6">
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <ScrollReveal delay={0.05}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#7342E2] bg-[#7342E2]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Global Infrastructure Telemetry
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#192837] tracking-tight mb-4">
              Geolocation & Threat Intelligence Engine
            </h2>
            <p className="font-body text-base text-[#192837]/75 leading-relaxed">
              Every email header contains digital breadcrumbs. CyberTrace maps sender IP origins, flags Tor/VPN proxies,
              and checks global threat feeds in milliseconds.
            </p>
          </div>
        </ScrollReveal>

        {/* 6 Intel Grid Cards using unified Card component */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {intelMetrics.map((item, idx) => {
            const Icon = item.icon
            return (
              <ScrollReveal key={item.title} delay={0.08 * idx} yOffset={35} scaleStart={0.94}>
                <Card
                  badge={item.badge}
                  title={item.title}
                  description={item.details}
                  className="p-7 text-left"
                >
                  <div className="pt-4 border-t border-[#192837]/8 flex items-center justify-between">
                    <div className="font-mono text-sm font-bold text-[#192837] truncate">
                      {item.value}
                    </div>
                    <div className="p-2 rounded-xl bg-[#FAF9F6] text-[#7342E2] shrink-0">
                      <Icon size={18} />
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

export default GeoIntelligence
