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
import { InteractiveHoverButton } from './ui/interactive-hover-button'

export const EarlyWarning: React.FC = () => {
  const [actionTaken, setActionTaken] = useState<string | null>(null)

  return (
    <section id="early-warning" className="py-24 px-5 sm:px-8 bg-[#050505] border-b border-[#2A2A2A]">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Early Warning Philosophy */}
          <div className="lg:col-span-6 text-left">
            <ScrollReveal delay={0.05}>
              <span className="text-xs font-bold uppercase tracking-widest text-[#FF1E2D] bg-[#FF1E2D]/10 border border-[#FF1E2D]/20 px-3.5 py-1.5 rounded-full inline-block mb-3">
                Proactive In-Inbox Triage
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight mb-5">
                Instant Early Warnings for High-Risk Inbound Emails
              </h2>
              <p className="font-body text-base text-[#A3A3A3] leading-relaxed mb-6">
                When an employee receives a malicious lure, every second counts. CyberTrace injects immediate,
                context-aware warning banners directly onto suspicious messages before credentials are typed or funds are wired.
              </p>
            </ScrollReveal>

            <div className="space-y-4 mb-8">
              <ScrollReveal delay={0.12} yOffset={25}>
                <Card
                  badge="HEADER INJECTION"
                  title="Real-Time Header Injections"
                  description="Clear visual indicators warn users with color-coded severity badges without disrupting normal email workflows."
                  className="p-4 bg-[#111111] border-[#2A2A2A]"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#FF1E2D] mt-1">
                    <BellRing size={15} /> Active Gmail / Outlook add-in hook
                  </div>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={0.2} yOffset={25}>
                <Card
                  badge="CLICK SANDBOXING"
                  title="Automated Click Interception"
                  description="Dangerous links are neutralized and wrapped in sandboxed URL inspection gateways to prevent drive-by downloads."
                  className="p-4 bg-[#111111] border-[#2A2A2A]"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#FF1E2D] mt-1">
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
                badge="CYBERTRACE EARLY WARNING"
                title="High-Risk Threat Intercepted"
                description="Risk Level: Critical • Finance Payroll Impersonation"
                className="p-7 sm:p-9 text-left bg-[#111111] border-[#2A2A2A] shadow-2xl"
              >
                {/* Threat Details */}
                <div className="space-y-3 mb-6 mt-3">
                  <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#2A2A2A]">
                    <div className="text-[11px] font-bold text-[#737373] uppercase tracking-wide mb-1">
                      Reason for Detection
                    </div>
                    <p className="text-xs text-[#A3A3A3] font-medium leading-relaxed">
                      This email is pretending to be <strong className="text-[#F5F5F5]">Finance Payroll</strong>. The sender domain was registered 2 hours ago and IP traces to a known bulletproof proxy.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FF1E2D]/10 border border-[#FF1E2D]/30">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF1E2D] mb-1">
                      <AlertTriangle size={14} /> Recommended Action
                    </div>
                    <p className="text-xs text-[#F5F5F5] leading-relaxed font-medium">
                      Do not click any embedded links or provide bank credentials. Report and quarantine immediately.
                    </p>
                  </div>
                </div>

                {/* Action Buttons Simulation */}
                <div className="pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-3">
                    Select Immediate Defensive Action
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <InteractiveHoverButton
                      text="Block Sender"
                      icon={<ShieldBan size={14} className="text-white" />}
                      onClick={() => setActionTaken('blocked')}
                      className="w-full py-2.5 px-3 text-xs font-bold text-white bg-[#E50914] hover:bg-[#FF1E2D] border-[#FF1E2D] shadow-xs"
                    />

                    <InteractiveHoverButton
                      text="Report Threat"
                      icon={<Flag size={14} className="text-[#FF1E2D]" />}
                      onClick={() => setActionTaken('reported')}
                      className="w-full py-2.5 px-3 text-xs font-bold text-[#F5F5F5] bg-[#181818] hover:bg-[#222222] border-[#2A2A2A] shadow-xs"
                    />

                    <InteractiveHoverButton
                      text="Warn User"
                      icon={<AlertTriangle size={14} className="text-[#FFB020]" />}
                      onClick={() => setActionTaken('warned')}
                      className="w-full py-2.5 px-3 text-xs font-bold text-[#FFB020] bg-[#FFB020]/10 hover:bg-[#FFB020]/20 border-[#FFB020]/30 shadow-xs"
                    />
                  </div>

                  {actionTaken && (
                    <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 size={15} />
                      <span>
                        Action Applied: <strong className="text-emerald-300">{actionTaken.toUpperCase()}</strong> command dispatched to FastAPI SOC router.
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
