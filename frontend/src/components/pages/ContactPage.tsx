import React from 'react'
import { Mail, ArrowLeft, ShieldCheck, Globe, Clock } from 'lucide-react'
import Logo from '../Logo'

interface ContactPageProps {
  onBack: () => void
  onOpenPrivacy?: () => void
  onOpenTerms?: () => void
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBack, onOpenPrivacy, onOpenTerms }) => {
  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#192837] font-body">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#192837]/10 px-5 sm:px-8 py-4">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-[#F2F2EE] hover:bg-[#e6e6e0] transition-all text-[#192837] cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center gap-2 border-l border-[#192837]/15 pl-3">
              <Logo size={28} />
              <span className="font-heading font-extrabold text-base tracking-tight text-[#192837]">
                Cyber<span className="text-[#7342E2]">Trace</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            {onOpenPrivacy && (
              <button onClick={onOpenPrivacy} className="hover:text-[#7342E2] transition-colors cursor-pointer">
                Privacy Policy
              </button>
            )}
            {onOpenTerms && (
              <button onClick={onOpenTerms} className="hover:text-[#7342E2] transition-colors cursor-pointer">
                Terms of Service
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[900px] mx-auto px-5 sm:px-8 py-12 sm:py-16 text-left">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#7342E2]/10 text-[#7342E2] text-xs font-extrabold tracking-wide uppercase mb-3">
            <Mail size={14} />
            <span>Support & Developer Contact</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#192837] tracking-tight mb-2">
            Contact Support & Security Team
          </h1>
          <p className="text-xs text-[#192837]/60 font-medium">
            CyberTrace Platform • Developer & Enterprise Inquiries
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Email Support Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
            <div className="p-3 rounded-xl bg-[#7342E2]/10 text-[#7342E2] w-fit">
              <Mail size={22} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-[#192837]">General Support & Administration</h3>
              <p className="text-xs text-[#192837]/70 mt-1">
                For technical support, account management, Google OAuth inquiries, and data deletion requests.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F8F8F6] border border-[#192837]/10">
              <span className="text-xs text-[#192837]/50 block font-bold uppercase tracking-wider">Primary Email</span>
              <a href="mailto:admin@cybertrace.local" className="text-xs sm:text-sm font-bold text-[#7342E2] hover:underline">
                admin@cybertrace.local
              </a>
            </div>
          </div>

          {/* Security & Vulnerabilities Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#192837]/10 shadow-sm space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 w-fit">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-[#192837]">Security & Compliance Officer</h3>
              <p className="text-xs text-[#192837]/70 mt-1">
                For vulnerability disclosures, security incident reports, and compliance auditing.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F8F8F6] border border-[#192837]/10">
              <span className="text-xs text-[#192837]/50 block font-bold uppercase tracking-wider">Security Desk</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-800">
                security@cybertrace.local
              </span>
            </div>
          </div>
        </div>

        {/* Project Info Section */}
        <div className="p-6 rounded-2xl bg-[#F8F8F6] border border-[#192837]/10 space-y-4 text-xs text-[#192837]/80">
          <h4 className="font-heading font-bold text-sm text-[#192837]">Platform Architecture & Deployment</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5">
              <Globe size={16} className="text-[#7342E2]" />
              <span>Production Web Console: <strong className="text-[#192837]">Vercel Edge Network</strong></span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="text-[#7342E2]" />
              <span>Response Time: <strong className="text-[#192837]">Within 24–48 Business Hours</strong></span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ContactPage
