import React from 'react'
import { Mail, ArrowLeft, ShieldCheck, Globe, Clock } from 'lucide-react'
import Logo from '../Logo'
import { InteractiveHoverButton } from '../ui/interactive-hover-button'

interface ContactPageProps {
  onBack: () => void
  onOpenPrivacy?: () => void
  onOpenTerms?: () => void
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBack, onOpenPrivacy, onOpenTerms }) => {
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
            {onOpenTerms && (
              <button onClick={onOpenTerms} className="text-[#A3A3A3] hover:text-[#FF1E2D] transition-colors cursor-pointer">
                Terms of Service
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[900px] mx-auto px-5 sm:px-8 py-12 sm:py-16 text-left">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FF1E2D]/10 text-[#FF1E2D] border border-[#FF1E2D]/30 text-xs font-mono font-bold tracking-wide uppercase mb-3">
            <Mail size={14} />
            <span>Support & Developer Contact</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-[#F5F5F5] tracking-tight mb-2">
            Contact Support & Security Team
          </h1>
          <p className="text-xs text-[#737373] font-mono">
            CyberTrace Platform • Developer & Enterprise Inquiries
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Email Support Card */}
          <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-[#2A2A2A] shadow-xl space-y-4">
            <div className="p-3 rounded-xl bg-[#FF1E2D]/10 text-[#FF1E2D] border border-[#FF1E2D]/25 w-fit">
              <Mail size={22} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-[#F5F5F5]">General Support & Administration</h3>
              <p className="text-xs text-[#A3A3A3] mt-1">
                For technical support, account management, Google OAuth inquiries, and data deletion requests.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#111111] border border-[#2A2A2A]">
              <span className="text-xs text-[#737373] block font-mono font-bold uppercase tracking-wider">Primary Email</span>
              <a href="mailto:admin@cybertrace.local" className="text-xs sm:text-sm font-mono font-bold text-[#FF1E2D] hover:underline">
                admin@cybertrace.local
              </a>
            </div>
          </div>

          {/* Security & Vulnerabilities Card */}
          <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-[#2A2A2A] shadow-xl space-y-4">
            <div className="p-3 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 w-fit">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-[#F5F5F5]">Security & Compliance Officer</h3>
              <p className="text-xs text-[#A3A3A3] mt-1">
                For vulnerability disclosures, security incident reports, and compliance auditing.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#111111] border border-[#2A2A2A]">
              <span className="text-xs text-[#737373] block font-mono font-bold uppercase tracking-wider">Security Desk</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400">
                security@cybertrace.local
              </span>
            </div>
          </div>
        </div>

        {/* Project Info Section */}
        <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-[#2A2A2A] space-y-4 text-xs text-[#A3A3A3]">
          <h4 className="font-heading font-bold text-sm text-[#F5F5F5]">Platform Architecture & Deployment</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5">
              <Globe size={16} className="text-[#FF1E2D]" />
              <span>Production Web Console: <strong className="text-[#F5F5F5]">Vercel Edge Network</strong></span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="text-[#FF1E2D]" />
              <span>Response Time: <strong className="text-[#F5F5F5]">Within 24–48 Business Hours</strong></span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ContactPage
