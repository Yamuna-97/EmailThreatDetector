import React from 'react'
import SpotlightCard from './SpotlightCard'
import {
  Mail,
  ShieldAlert,
  AlertTriangle,
  Globe2,
  Activity,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react'

const stats = [
  { label: 'Total Emails Analyzed', value: '18,492', change: '+12.4% today', icon: Mail, color: 'text-blue-600 bg-blue-50' },
  { label: 'Threats Intercepted', value: '418', change: '100% neutralized', icon: ShieldAlert, color: 'text-rose-600 bg-rose-50' },
  { label: 'High-Risk BEC Emails', value: '62', change: 'Quarantined', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
  { label: 'Suspicious IPs Blocked', value: '194', change: 'Tor / Proxy flagged', icon: Globe2, color: 'text-purple-600 bg-purple-50' },
]

const recentAlerts = [
  { id: 'ALT-9921', time: '2m ago', sender: 'billing@apple-support-verify.com', threat: 'Credential Phishing', score: 98, level: 'Critical' },
  { id: 'ALT-9920', time: '14m ago', sender: 'wire-transfer@offshore-bank.cc', threat: 'Wire Fraud / BEC', score: 94, level: 'Critical' },
  { id: 'ALT-9919', time: '45m ago', sender: 'newsletter@sales-tracker.io', threat: 'Tracking Pixel / Urgency', score: 48, level: 'Suspicious' },
  { id: 'ALT-9918', time: '1h ago', sender: 'hr-updates@payroll-service.org', threat: 'Spoofed Executive Domain', score: 86, level: 'High' },
]

export const DashboardPreview: React.FC = () => {
  return (
    <section id="dashboard" className="py-24 px-5 sm:px-8 bg-white border-b border-[#192837]/6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#7342E2] bg-[#7342E2]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Real-Time SOC Command Center
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#192837] tracking-tight mb-4">
            Unified Threat Telemetry & Monitoring Dashboard
          </h2>
          <p className="font-body text-base text-[#192837]/75 leading-relaxed">
            Gain immediate visibility into corporate email health, active cyber campaigns, risk distribution, and ongoing
            forensic case investigations.
          </p>
        </div>

        {/* 4 Quick Stat Metric Cards using SpotlightCard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {stats.map((st) => {
            const Icon = st.icon
            return (
              <SpotlightCard
                key={st.label}
                spotlightColor="rgba(115, 66, 226, 0.12)"
                className="p-6 rounded-3xl bg-[#FAF9F6] border border-[#192837]/8 text-left"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-[#192837]/60">{st.label}</span>
                  <div className={`p-2 rounded-xl ${st.color}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="font-heading text-3xl font-extrabold text-[#192837] mb-1.5">
                  {st.value}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <TrendingUp size={13} />
                  <span>{st.change}</span>
                </div>
              </SpotlightCard>
            )
          })}
        </div>

        {/* Complex Dashboard Interface Mockup */}
        <div className="rounded-3xl border border-[#192837]/10 bg-[#FAF9F6] p-6 sm:p-8 shadow-xl text-left">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#192837]/10 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#7342E2] text-white">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-[#192837]">Active Threat Feed Stream</h3>
                <p className="text-xs text-[#192837]/60">FastAPI Async Webhook Listener • Connected to Gmail API</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Ingestion
              </span>
            </div>
          </div>

          {/* Grid Layout for Live Table & Risk Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Live Alerts Stream Table */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#192837]/70">
                  Recent Inbound Threat Alerts
                </span>
                <span className="text-xs text-[#7342E2] font-semibold flex items-center gap-1 cursor-pointer">
                  View Full Logs <ArrowUpRight size={13} />
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#192837]/10 text-[#192837]/50 font-bold uppercase tracking-wide">
                      <th className="py-2.5 px-3">Alert ID</th>
                      <th className="py-2.5 px-3">Sender Address</th>
                      <th className="py-2.5 px-3">Threat Category</th>
                      <th className="py-2.5 px-3 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#192837]/6">
                    {recentAlerts.map((alt) => (
                      <tr key={alt.id} className="hover:bg-white/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#7342E2]">{alt.id}</td>
                        <td className="py-3 px-3 font-mono font-medium text-[#192837] truncate max-w-[200px]">{alt.sender}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-rose-50 text-rose-700 border border-rose-200">
                            {alt.threat}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-rose-600">{alt.score}/100</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risk Distribution & Threat Breakdown */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-[#192837]/8 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#192837]/70 mb-4">
                  Threat Category Distribution
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-[#192837] mb-1">
                      <span>Phishing & Credential Harvest</span>
                      <span>42%</span>
                    </div>
                    <div className="h-2 w-full bg-[#FAF9F6] rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full w-[42%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-[#192837] mb-1">
                      <span>BEC & Wire Transfer Fraud</span>
                      <span>28%</span>
                    </div>
                    <div className="h-2 w-full bg-[#FAF9F6] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-[28%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-[#192837] mb-1">
                      <span>Spoofing & Impersonation</span>
                      <span>18%</span>
                    </div>
                    <div className="h-2 w-full bg-[#FAF9F6] rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full w-[18%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-[#192837] mb-1">
                      <span>Malicious Attachments / ISOs</span>
                      <span>12%</span>
                    </div>
                    <div className="h-2 w-full bg-[#FAF9F6] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-[12%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#192837]/8 text-[11px] text-[#192837]/70 font-medium">
                Live updates synced via FastAPI Websockets.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardPreview
