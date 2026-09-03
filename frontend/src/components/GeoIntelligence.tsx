import React from 'react'
import SpotlightCard from './SpotlightCard'
import {
  Globe2,
  Server,
  MapPin,
  ShieldX,
  Radar,
  Network,
  Cpu,
  Check,
  AlertTriangle,
} from 'lucide-react'

const intelMetrics = [
  {
    title: 'Sender IP Analysis',
    value: '185.220.101.44',
    status: 'Flagged Malicious',
    statusColor: 'text-rose-600 bg-rose-50 border-rose-200',
    icon: Network,
    details: 'Originates from known bulletproof hosting infrastructure with high fraud scores.',
  },
  {
    title: 'IP Geolocation & City',
    value: 'Frankfurt, Germany (DE)',
    status: 'High Anomaly',
    statusColor: 'text-amber-600 bg-amber-50 border-amber-200',
    icon: MapPin,
    details: 'Region mismatch: sender claims US executive branch but transmits from European datacenter.',
  },
  {
    title: 'ISP & Autonomous System (ASN)',
    value: 'AS200052 • FlokiNET ISP',
    status: 'Verified ASN',
    statusColor: 'text-blue-600 bg-blue-50 border-blue-200',
    icon: Server,
    details: 'Autonomous system associated with offshore VPS hosting and privacy tunnels.',
  },
  {
    title: 'Proxy / VPN / Tor Detection',
    value: 'Active Tor Exit Node',
    status: 'Critical Alert',
    statusColor: 'text-rose-600 bg-rose-50 border-rose-200',
    icon: ShieldX,
    details: 'Direct routing through an anonymizing onion proxy to conceal actual physical origin.',
  },
  {
    title: 'IP & Domain Reputation',
    value: 'Fraud Score: 98 / 100',
    status: 'Blacklisted in 14 Feeds',
    statusColor: 'text-rose-600 bg-rose-50 border-rose-200',
    icon: Radar,
    details: 'Correlated across IPQualityScore, Spamhaus, and AbuseIPDB global threat databases.',
  },
  {
    title: 'Threat Intel Correlation',
    value: 'Linked to APT-29 Campaign',
    status: 'Correlated Indicator',
    statusColor: 'text-purple-600 bg-purple-50 border-purple-200',
    icon: Cpu,
    details: 'Automated clustering connects infrastructure fingerprints with known cybercrime rings.',
  },
]

export const GeoIntelligence: React.FC = () => {
  return (
    <section id="intelligence" className="py-24 px-5 sm:px-8 bg-[#FAF9F6] border-b border-[#192837]/6">
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#7342E2] bg-[#7342E2]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Global Infrastructure Telemetry
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#192837] tracking-tight mb-4">
            Geolocation & Threat Intelligence Engine
          </h2>
          <p className="font-body text-base text-[#192837]/75 leading-relaxed">
            Every email header contains digital breadcrumbs. VaultShield maps sender IP origins, flags Tor/VPN proxies,
            and checks global threat feeds in milliseconds.
          </p>
        </div>

        {/* 6 Intel Grid Cards using SpotlightCard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {intelMetrics.map((item) => {
            const Icon = item.icon
            return (
              <SpotlightCard
                key={item.title}
                spotlightColor="rgba(115, 66, 226, 0.14)"
                className="bg-white border border-[#192837]/8 p-7 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-[#7342E2]/10 text-[#7342E2]">
                      <Icon size={20} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>

                  <h3 className="font-heading text-xs font-bold text-[#192837]/60 uppercase tracking-wider mb-1">
                    {item.title}
                  </h3>
                  <div className="font-mono text-base font-bold text-[#192837] mb-3">
                    {item.value}
                  </div>
                </div>

                <p className="font-body text-xs text-[#192837]/70 leading-relaxed pt-3 border-t border-[#192837]/6">
                  {item.details}
                </p>
              </SpotlightCard>
            )
          })}
        </div>

        {/* Interactive Threat Map Visual Banner */}
        <div className="rounded-3xl p-6 sm:p-8 bg-[#192837] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3.5 rounded-2xl bg-white/10 text-white shrink-0">
              <Globe2 size={28} className="text-[#a78bfa]" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">Live Geo-Correlation Database</h3>
              <p className="text-xs sm:text-sm text-gray-300 font-body">
                Integrated with IPQualityScore, MaxMind GeoIP2, AbuseIPDB, and Tor Exit Node lists.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Check size={14} /> 2.4M Malicious IPs Indexed
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <AlertTriangle size={14} /> Sub-50ms Query Time
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default GeoIntelligence
