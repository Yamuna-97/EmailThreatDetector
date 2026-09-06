import React from 'react'
import Logo from './Logo'

interface FooterProps {
  onOpenPrivacy?: () => void
  onOpenTerms?: () => void
  onOpenContact?: () => void
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenTerms, onOpenContact }) => {
  return (
    <footer className="bg-white border-t border-[#192837]/10 py-16 px-5 sm:px-8 text-left">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#192837]/10">
          {/* Brand Info */}
          <div className="md:col-span-5 flex flex-col items-start">
            <div className="flex items-center gap-2.5 mb-4">
              <Logo size={32} />
              <span className="font-heading text-xl font-extrabold text-[#192837]">
                Cyber<span className="text-[#7342E2]">Trace</span>
              </span>
            </div>
            <p className="font-body text-xs sm:text-sm text-[#192837]/70 leading-relaxed max-w-sm mb-4">
              AI-Powered Email Threat Detection, Geolocation and Forensic Intelligence Platform engineered for
              enterprise security and SOC operations.
            </p>
            <span className="text-xs font-bold text-[#7342E2] bg-[#7342E2]/10 px-3 py-1 rounded-full">
              Enterprise Defense Platform
            </span>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#192837] mb-4">
              Platform Features
            </h4>
            <ul className="space-y-2.5 text-xs text-[#192837]/80 font-medium">
              <li>
                <a href="#detection" className="hover:text-[#7342E2] transition-colors">
                  Detection
                </a>
              </li>
              <li>
                <a href="#intelligence" className="hover:text-[#7342E2] transition-colors">
                  Intelligence
                </a>
              </li>
              <li>
                <a href="#forensics" className="hover:text-[#7342E2] transition-colors">
                  Forensics
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#7342E2] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#7342E2] transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Project */}
          <div className="md:col-span-4">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#192837] mb-4">
              Compliance & Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-[#192837]/80 font-medium">
              <li>
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="hover:text-[#7342E2] transition-colors cursor-pointer text-left"
                >
                  Privacy Policy (Google Limited Use)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="hover:text-[#7342E2] transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenContact}
                  className="hover:text-[#7342E2] transition-colors cursor-pointer text-left"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <span className="text-xs text-[#192837]/50 block pt-1">
                  AI-Powered Cyber Defense & Incident Intelligence
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#192837]/60">
          <p>© 2026 CyberTrace. All rights reserved. Enterprise Security Team.</p>
          <div className="flex items-center gap-6">
            <button type="button" onClick={onOpenPrivacy} className="hover:text-[#7342E2] cursor-pointer">
              Privacy
            </button>
            <button type="button" onClick={onOpenTerms} className="hover:text-[#7342E2] cursor-pointer">
              Terms
            </button>
            <button type="button" onClick={onOpenContact} className="hover:text-[#7342E2] cursor-pointer">
              Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
