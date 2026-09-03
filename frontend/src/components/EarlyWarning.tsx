import React, { useState } from 'react'
import SpotlightCard from './SpotlightCard'
import {
  BellRing,
  ShieldAlert,
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

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#192837]/8">
                <div className="p-2 rounded-xl bg-[#7342E2]/10 text-[#7342E2] shrink-0 mt-0.5">
                  <BellRing size={18} />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-[#192837]">Real-Time Header Injections</h4>
                  <p className="text-xs text-[#192837]/70 mt-0.5">
                    Clear visual indicators warn users with color-coded severity badges without disrupting normal email workflows.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#192837]/8">
                <div className="p-2 rounded-xl bg-[#7342E2]/10 text-[#7342E2] shrink-0 mt-0.5">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-[#192837]">Automated Click Interception</h4>
                  <p className="text-xs text-[#192837]/70 mt-0.5">
                    Dangerous links are neutralized and wrapped in sandboxed URL inspection gateways to prevent drive-by downloads.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Early Warning Banner Simulator using SpotlightCard */}
          <div className="lg:col-span-6">
            <SpotlightCard
              spotlightColor="rgba(225, 29, 72, 0.12)"
              className="bg-[#FAF9F6] border-2 border-rose-500/30 p-7 sm:p-9 rounded-3xl shadow-xl text-left"
            >
              {/* Alert Header */}
              <div className="flex items-center justify-between pb-4 border-b border-rose-200 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-600 text-white animate-pulse">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600">
                      VAULTSHIELD EARLY WARNING
                    </span>
                    <h3 className="font-heading font-bold text-base text-[#192837]">
                      High-Risk Threat Intercepted
                    </h3>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-700 border border-rose-300">
                  Risk Level: Critical
                </span>
              </div>

              {/* Threat Details */}
              <div className="space-y-3 mb-6">
                <div className="p-3.5 rounded-2xl bg-white border border-[#192837]/8">
                  <div className="text-[11px] font-bold text-[#192837]/50 uppercase tracking-wide mb-1">
                    Reason for Detection
                  </div>
                  <p className="text-xs text-[#192837] font-medium leading-relaxed">
                    This email is pretending to be <strong>Finance Payroll</strong>. The sender domain was registered 2 hours ago and IP traces to a known bulletproof proxy.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
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
            </SpotlightCard>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EarlyWarning
