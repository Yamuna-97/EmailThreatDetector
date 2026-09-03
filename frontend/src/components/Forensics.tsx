import React from 'react'
import Card from './Card'
import {
  FileCode,
  Network,
  Search,
  Globe,
  Compass,
  Link2,
  FolderArchive,
  Clock,
} from 'lucide-react'

const forensicCapabilities = [
  {
    title: 'Email Header Parsing',
    badge: 'RFC PARSER',
    icon: FileCode,
    desc: 'Extracts full Received headers, Message-ID hashes, Return-Path, and X-Originating-IP signatures with RFC compliance verification.',
  },
  {
    title: 'Sender Infrastructure Tracing',
    badge: 'SMTP RELAY',
    icon: Network,
    desc: 'Traces SMTP relay hops, MX records, and mail transfer agent (MTA) intermediaries to identify infrastructure pivot points.',
  },
  {
    title: 'Deep IP Investigation',
    badge: 'BGP CORRELATION',
    icon: Search,
    desc: 'Correlates IP historical routing, PTR records, BGP announcements, and previous threat campaign involvements.',
  },
  {
    title: 'Domain Investigation & WHOIS',
    badge: 'DNS FORENSICS',
    icon: Globe,
    desc: 'Uncovers registrar details, nameserver configurations, domain creation dates, and DNS records (A, TXT, DMARC, DKIM).',
  },
  {
    title: 'Geographic Clues & Routing',
    badge: 'GEO ROUTING',
    icon: Compass,
    desc: 'Analyzes timezone anomalies in headers versus sender claim, physical datacenters, and anomalous intermediate routing jumps.',
  },
  {
    title: 'Related Indicators of Compromise',
    badge: 'IOC CLUSTERING',
    icon: Link2,
    desc: 'Clusters related MD5/SHA256 file hashes, attacker cryptocurrency wallets, and malicious URLs across all analyzed inboxes.',
  },
  {
    title: 'Evidence Collection & Custody',
    badge: 'CHAIN OF CUSTODY',
    icon: FolderArchive,
    desc: 'Generates forensically-sound JSON and PDF export reports suitable for incident response teams and legal proceedings.',
  },
  {
    title: 'Investigation Timeline',
    badge: 'CHRONOLOGY',
    icon: Clock,
    desc: 'Constructs a microsecond-accurate chronology from message composition to transit, gateway arrival, and automated neutralization.',
  },
]

export const Forensics: React.FC = () => {
  return (
    <section id="forensics" className="py-24 px-5 sm:px-8 bg-white border-b border-[#192837]/6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#7342E2] bg-[#7342E2]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Digital Forensics & Incident Response (DFIR)
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#192837] tracking-tight mb-4">
            Empower Security Analysts with Forensic Intelligence
          </h2>
          <p className="font-body text-base text-[#192837]/75 leading-relaxed">
            Move beyond superficial warnings. VaultShield equips cybersecurity investigators with granular forensic
            artifacts, automated header parsing, and verifiable chains of evidence.
          </p>
        </div>

        {/* 8 Forensic Grid Cards using unified Card component */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {forensicCapabilities.map((item) => {
            const Icon = item.icon
            return (
              <Card
                key={item.title}
                badge={item.badge}
                title={item.title}
                description={item.desc}
                className="p-6 text-left"
              >
                <div className="pt-3 border-t border-[#192837]/8 flex justify-end">
                  <div className="p-2 rounded-xl bg-[#FAF9F6] text-[#7342E2]">
                    <Icon size={18} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Interactive Forensic Timeline Demo */}
        <Card
          badge="FORENSIC AUDIT"
          title="Sample Investigation Timeline"
          description="Case #VS-2026-0881 • Target: finance@enterprise.com • Automated Forensics Complete"
          className="p-7 sm:p-9 text-left"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/8">
              <div className="text-[11px] font-mono text-[#7342E2] font-semibold mb-1">08:14:02 UTC</div>
              <div className="text-xs font-bold text-[#192837] mb-1">Origin Transit</div>
              <p className="text-[11px] text-[#192837]/70">SMTP packet dispatched via anonymized VPS relay 185.220.101.44.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/8">
              <div className="text-[11px] font-mono text-[#7342E2] font-semibold mb-1">08:14:03 UTC</div>
              <div className="text-xs font-bold text-[#192837] mb-1">Header Parsing</div>
              <p className="text-[11px] text-[#192837]/70">SPF softfail detected; domain dkim signature mismatch flag raised.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/8">
              <div className="text-[11px] font-mono text-[#7342E2] font-semibold mb-1">08:14:04 UTC</div>
              <div className="text-xs font-bold text-[#192837] mb-1">AI & Threat Feed Correlation</div>
              <p className="text-[11px] text-[#192837]/70">Gemini identifies wire fraud intent; IPQualityScore confirms fraud score 98.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/8">
              <div className="text-[11px] font-mono text-emerald-600 font-semibold mb-1">08:14:05 UTC</div>
              <div className="text-xs font-bold text-[#192837] mb-1">Evidence Quarantined</div>
              <p className="text-[11px] text-[#192837]/70">Automated warning banner injected; IOC forensic dossier exported.</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}

export default Forensics
