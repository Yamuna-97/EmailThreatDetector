import React, { useState } from 'react'
import Card from './Card'
import ScrollReveal from './ScrollReveal'
import {
  BellRing,
  ShieldBan,
  Flag,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react'

export const EarlyWarning: React.FC = () => {
  const [actionTaken, setActionTaken] = useState<string | null>(null)

  return (
    <section id="early-warning" className="py-24 px-5 sm:px-8 bg-white border-b border-[#192837]/6">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Early Warning Philosophy */}
          <div className="lg:col-span-6 text-left">
            <ScrollReveal delay={0.05}>
              <span className="text-xs font-bold uppercase tracking-widest text-[#7342E2] bg-[#7342E2]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
                Proactive In-Inbox Triage
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#192837] tracking-tight mb-5">
                Instant Early Warnings for High-Risk Inbound Emails
              </h2>
              <p className="font-body text-base text-[#192837]/80 leading-relaxed mb-6">
                When an employee receives a malicious lure, every second counts. VaultShield injects immediate,
                context-aware warning banners directly onto suspicious messages before credentials are typed or funds are wired.
              </p>
            </ScrollReveal>

            <div className="space-y-4 mb-8">
              <ScrollReveal delay={0.12} yOffset={25}>
                <Card
                  badge="HEADER INJECTION"
                  title="Real-Time Header Injections"
                  description="Clear visual indicators warn users with color-coded severity badges without disrupting normal email workflows."
                  className="p-4"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#7342E2] mt-1">
                    <BellRing size={15} /> Active Gmail / Outlook add-in hook
                  </div>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={0.2} yOffset={25}>
                <Card
                  badge="CLICK SANDBOXING"
                  title="Automated Click Interception"
                  description="Dangerous links are neutralized and wrapped in sandboxed URL inspection gateways to prevent drive-by downloads."
                  className="p-4"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#7342E2] mt-1">
                    <Lock size={15} /> Zero-day link shielding active
                  </div>
                </Card>
              </ScrollReveal>
            </div>
          </div>

          {/* Right Column: Live Early Warning Banner Simulator using Card */}
          <div className="lg:col-span-6">
            <ScrollReveal delay={0.2} yOffset={40} scaleStart={0.93}>
              <Card
                badge="VAULTSHIELD EARLY WARNING"
                title="High-Risk Threat Intercepted"
                description="Risk Level: Critical • Finance Payroll Impersonation"
                className="p-7 sm:p-9 text-left shadow-2xl"
              >
                {/* Threat Details */}
                <div className="space-y-3 mb-6 mt-3">
                  <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#192837]/8">
                    <div className="text-[11px] font-bold text-[#192837]/50 uppercase tracking-wide mb-1">
                      Reason for Detection
                    </div>
                    <p className="text-xs text-[#192837] font-medium leading-relaxed">
                      This email is pretending to be <strong>Finance Payroll</strong>. The sender domain was registered 2 hours ago and IP traces to a known bulletproof proxy.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1">
                      <AlertTriangle size={14} /> Recommended Action
                    </div>
                    <p className="text-xs text-rose-900 leading-relaxed font-medium">
                      Do not click any embedded links or provide bank credentials. Report and quarantine immediately.
                    </p>
                  </div>
                </div>

                {/* Action Buttons Simulation */}
                <div className="pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#192837]/60 mb-3">
                    Select Immediate Defensive Action
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActionTaken('blocked')}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      <ShieldBan size={14} />
                      <span>Block Sender</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionTaken('reported')}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-[#192837] bg-white border border-[#192837]/15 hover:bg-[#FAF9F6] active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      <Flag size={14} className="text-[#7342E2]" />
                      <span>Report Threat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionTaken('warned')}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 active:scale-95 transition-all cursor-pointer border border-amber-300 shadow-xs"
                    >
                      <AlertTriangle size={14} />
                      <span>Warn User</span>
                    </button>
                  </div>

                  {actionTaken && (
                    <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 size={15} />
                      <span>
                        Action Applied: <strong>{actionTaken.toUpperCase()}</strong> command dispatched to FastAPI SOC router.
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EarlyWarning
