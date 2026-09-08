import React from 'react'
import Card from './Card'
import ScrollReveal from './ScrollReveal'
import {
  Mail,
  ShieldAlert,
  AlertTriangle,
  Globe2,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react'

const stats = [
  { label: 'Total Emails Analyzed', badge: 'INGESTION', value: '18,492', change: '+12.4% today', icon: Mail },
  { label: 'Threats Intercepted', badge: 'NEUTRALIZED', value: '418', change: '100% neutralized', icon: ShieldAlert },
  { label: 'High-Risk BEC Emails', badge: 'QUARANTINED', value: '62', change: 'Zero breaches', icon: AlertTriangle },
  { label: 'Suspicious IPs Blocked', badge: 'TOR / PROXIES', value: '194', change: 'Global feed blacklist', icon: Globe2 },
]

const recentAlerts = [
  { id: 'ALT-9921', time: '2m ago', sender: 'billing@apple-support-verify.com', threat: 'Credential Phishing', score: 98, level: 'Critical' },
  { id: 'ALT-9920', time: '14m ago', sender: 'wire-transfer@offshore-bank.cc', threat: 'Wire Fraud / BEC', score: 94, level: 'Critical' },
  { id: 'ALT-9919', time: '45m ago', sender: 'newsletter@sales-tracker.io', threat: 'Tracking Pixel / Urgency', score: 48, level: 'Suspicious' },
  { id: 'ALT-9918', time: '1h ago', sender: 'hr-updates@payroll-service.org', threat: 'Spoofed Executive Domain', score: 86, level: 'High' },
]

export const DashboardPreview: React.FC = () => {
  return (
    <section id="dashboard" className="py-24 px-5 sm:px-8 bg-[#050505] border-b border-[#2A2A2A]">
      <div className="max-w-[1280px] mx-auto">
        <ScrollReveal delay={0.05}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF1E2D] bg-[#FF1E2D]/10 border border-[#FF1E2D]/20 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Real-Time SOC Command Center
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight mb-4">
              Unified Threat Telemetry & Monitoring Dashboard
            </h2>
            <p className="font-body text-base text-[#A3A3A3] leading-relaxed">
              Gain immediate visibility into corporate email health, active cyber campaigns, risk distribution, and ongoing
              forensic case investigations.
            </p>
          </div>
        </ScrollReveal>

        {/* 4 Quick Stat Metric Cards using unified Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {stats.map((st, idx) => {
            const Icon = st.icon
            return (
              <ScrollReveal key={st.label} delay={0.08 * idx} yOffset={30} scaleStart={0.94}>
                <Card
                  badge={st.badge}
                  title={st.value}
                  description={st.label}
                  className="p-6 text-left hover:border-[#FF1E2D]/40"
                >
                  <div className="pt-3 border-t border-[var(--border-primary)] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <TrendingUp size={13} />
                      <span>{st.change}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-primary)] text-[#FF1E2D]">
                      <Icon size={16} />
                    </div>
                  </div>
                </Card>
              </ScrollReveal>
            )
          })}
        </div>

        {/* Complex Dashboard Interface Mockup */}
        <ScrollReveal delay={0.2} yOffset={40} scaleStart={0.95}>
          <Card
            badge="SOC LIVE STREAM"
            title="Active Threat Feed Stream"
            description="FastAPI Async Webhook Listener • Connected to Gmail API • Sub-50ms Response"
            className="p-6 sm:p-8 text-left shadow-2xl"
          >
            {/* Grid Layout for Live Table & Risk Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
              {/* Live Alerts Stream Table */}
              <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3]">
                    Recent Inbound Threat Alerts
                  </span>
                  <span className="text-xs text-[#FF1E2D] font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                    View Full Logs <ArrowUpRight size={13} />
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#2A2A2A] text-[#737373] font-bold uppercase tracking-wide">
                        <th className="py-2.5 px-3">Alert ID</th>
                        <th className="py-2.5 px-3">Sender Address</th>
                        <th className="py-2.5 px-3">Threat Category</th>
                        <th className="py-2.5 px-3 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A]">
                      {recentAlerts.map((alt) => (
                        <tr key={alt.id} className="hover:bg-[#181818] transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-[#FF1E2D]">{alt.id}</td>
                          <td className="py-3 px-3 font-mono font-medium text-[#F5F5F5] truncate max-w-[200px]">{alt.sender}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                              alt.level === 'Critical'
                                ? 'bg-[#FF1E2D]/15 text-[#FF1E2D] border border-[#FF1E2D]/30'
                                : alt.level === 'High'
                                ? 'bg-[#FF5A36]/15 text-[#FF5A36] border border-[#FF5A36]/30'
                                : 'bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30'
                            }`}>
                              {alt.threat}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-[#FF1E2D]">{alt.score}/100</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Risk Distribution & Threat Breakdown */}
              <div className="lg:col-span-4 p-5 rounded-2xl bg-[#181818] border border-[#2A2A2A] flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3] mb-4">
                    Threat Category Distribution
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-[#F5F5F5] mb-1">
                        <span>Phishing & Credential Harvest</span>
                        <span className="text-[#FF1E2D]">42%</span>
                      </div>
                      <div className="h-2 w-full bg-[#0A0A0A] rounded-full overflow-hidden border border-[#2A2A2A]">
                        <div className="h-full bg-[#FF1E2D] rounded-full w-[42%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-[#F5F5F5] mb-1">
                        <span>BEC & Wire Transfer Fraud</span>
                        <span className="text-[#FF5A36]">28%</span>
                      </div>
                      <div className="h-2 w-full bg-[#0A0A0A] rounded-full overflow-hidden border border-[#2A2A2A]">
                        <div className="h-full bg-[#FF5A36] rounded-full w-[28%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-[#F5F5F5] mb-1">
                        <span>Spoofing & Impersonation</span>
                        <span className="text-[#FFB020]">18%</span>
                      </div>
                      <div className="h-2 w-full bg-[#0A0A0A] rounded-full overflow-hidden border border-[#2A2A2A]">
                        <div className="h-full bg-[#FFB020] rounded-full w-[18%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-[#F5F5F5] mb-1">
                        <span>Malicious Attachments / ISOs</span>
                        <span className="text-blue-400">12%</span>
                      </div>
                      <div className="h-2 w-full bg-[#0A0A0A] rounded-full overflow-hidden border border-[#2A2A2A]">
                        <div className="h-full bg-blue-500 rounded-full w-[12%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#2A2A2A] text-[11px] text-[#737373] font-medium">
                  Live updates synced via FastAPI Websockets.
                </div>
              </div>
            </div>
          </Card>
        </ScrollReveal>
      </div>
    </section>
  )
}

export default DashboardPreview
