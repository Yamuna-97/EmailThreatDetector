import React from 'react'
import { FileText, ArrowLeft, AlertCircle, Mail } from 'lucide-react'
import Logo from '../Logo'
import { InteractiveHoverButton } from '../ui/interactive-hover-button'

interface TermsPageProps {
  onBack: () => void
  onOpenPrivacy?: () => void
  onOpenContact?: () => void
}

export const TermsOfService: React.FC<TermsPageProps> = ({ onBack, onOpenPrivacy, onOpenContact }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] font-body">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#2A2A2A] px-5 sm:px-8 py-4">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InteractiveHoverButton
              onClick={onBack}
              text="Back to Home"
              icon={<ArrowLeft size={16} className="text-[#FF1E2D]" />}
              className="py-1.5 px-3 text-xs font-bold bg-[#181818] border-[#2A2A2A] text-[#F5F5F5]"
            />
            <div className="flex items-center gap-2 border-l border-[#2A2A2A] pl-3">
              <Logo size={28} />
              <span className="font-heading font-black text-base tracking-tight text-[#F5F5F5]">
                Cyber<span className="text-[#FF1E2D]">Trace</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            {onOpenPrivacy && (
              <button onClick={onOpenPrivacy} className="text-[#A3A3A3] hover:text-[#FF1E2D] transition-colors cursor-pointer">
                Privacy Policy
              </button>
            )}
            {onOpenContact && (
              <button onClick={onOpenContact} className="text-[#A3A3A3] hover:text-[#FF1E2D] transition-colors cursor-pointer">
                Contact
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[900px] mx-auto px-5 sm:px-8 py-12 sm:py-16 text-left">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FF1E2D]/10 text-[#FF1E2D] border border-[#FF1E2D]/30 text-xs font-mono font-bold tracking-wide uppercase mb-3">
            <FileText size={14} />
            <span>Platform Agreement & Usage Terms</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-[#F5F5F5] tracking-tight mb-2">
            Terms of Service
          </h1>
          <p className="text-xs text-[#737373] font-mono">
            Effective Date: September 2026 • Platform: CyberTrace / Email Threat Intelligence
          </p>
        </div>

        <div className="space-y-10 text-xs sm:text-sm text-[#A3A3A3] leading-relaxed font-normal">
          {/* Section 1 */}
          <section className="space-y-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">1. Acceptance of Terms</h3>
            <p>
              By accessing, browsing, or using CyberTrace (<strong className="text-[#F5F5F5]">"the Platform"</strong>, <strong className="text-[#F5F5F5]">"we"</strong>, <strong className="text-[#F5F5F5]">"our"</strong>), or by connecting your Google/Gmail account, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">2. Service Description & Permitted Purpose</h3>
            <p>
              CyberTrace is an enterprise defensive security tool engineered to provide:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#A3A3A3]">
              <li>Automated email threat inspection (Phishing, BEC, Impersonation, Malicious URLs).</li>
              <li>Sender IP intelligence, proxy/VPN reputation checks, and approximate relay geolocation.</li>
              <li>Gemini AI forensic threat explanation and RFC email authentication analysis.</li>
              <li>SOC investigator triage and automated early warning notification delivery.</li>
            </ul>
          </section>

          {/* Section 3: AI Disclaimer */}
          <section className="space-y-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">3. AI-Generated Intelligence & Security Disclaimer</h3>
            <div className="p-4 rounded-xl bg-[#181818] border border-amber-500/30 text-amber-300">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-amber-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold text-xs text-amber-200">Advisory Nature of Threat Scoring</p>
                  <p className="text-xs leading-relaxed text-amber-300/80">
                    Threat scores, risk assessments, and forensic intelligence generated by CyberTrace are powered by machine learning algorithms, heuristic heuristics, and Gemini AI. While designed for high precision, they are advisory tools intended to assist security teams and users. CyberTrace does not guarantee 100% detection of zero-day threats or the complete absence of false positives.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Acceptable Use */}
          <section className="space-y-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">4. Acceptable Use Policy</h3>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Platform to scan, intercept, or analyze email accounts for which you do not possess explicit authorization.</li>
              <li>Reverse engineer, exploit, or attempt unauthorized penetration testing against platform APIs or infrastructure.</li>
              <li>Use the Platform to build competing threat vectors or evade security defenses.</li>
            </ul>
          </section>

          {/* Section 5: Disconnection & Termination */}
          <section className="space-y-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">5. Account Termination & Data Purge</h3>
            <p>
              You may disconnect your Google Workspace/Gmail account or request permanent deletion of all stored security scan data at any time via the user profile dashboard. We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          {/* Section 6: Limitation of Liability */}
          <section className="space-y-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">6. Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by applicable law, CyberTrace and its maintainers shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the service, including security incidents occurring outside the scope of platform monitoring.
            </p>
          </section>

          {/* Section 7: Contact */}
          <section className="space-y-3 pt-4 border-t border-[#2A2A2A]">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">7. Inquiries</h3>
            <p>Questions regarding these Terms of Service may be addressed to:</p>
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#2A2A2A] flex items-center gap-3">
              <Mail size={18} className="text-[#FF1E2D]" />
              <div>
                <p className="text-xs font-bold text-[#F5F5F5]">CyberTrace Compliance & Security</p>
                <p className="text-xs text-[#FF1E2D] font-mono font-semibold">admin@cybertrace.local</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default TermsOfService
