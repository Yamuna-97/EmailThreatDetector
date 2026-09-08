import React from 'react'
import Logo from './Logo'

interface FooterProps {
  onOpenPrivacy?: () => void
  onOpenTerms?: () => void
  onOpenContact?: () => void
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenTerms, onOpenContact }) => {
  return (
    <footer className="bg-[#050505] border-t border-[#2A2A2A] py-16 px-5 sm:px-8 text-left">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#2A2A2A]">
          {/* Brand Info */}
          <div className="md:col-span-5 flex flex-col items-start">
            <div className="flex items-center gap-2.5 mb-4">
              <Logo size={32} />
              <span className="font-heading text-xl font-extrabold text-[#F5F5F5]">
                Cyber<span className="text-[#E50914]">Trace</span>
              </span>
            </div>
            <p className="font-body text-xs sm:text-sm text-[#A3A3A3] leading-relaxed max-w-sm mb-4">
              AI-Powered Email Threat Detection, Geolocation and Forensic Intelligence Platform engineered for
              enterprise security and SOC operations.
            </p>
            <span className="font-mono text-xs font-bold text-[#FF1E2D] bg-[#E50914]/12 border border-[#E50914]/30 px-3 py-1 rounded-full">
              Enterprise Defense Platform
            </span>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#F5F5F5] mb-4">
              Platform Features
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A3A3A3] font-medium">
              <li>
                <a href="#detection" className="hover:text-[#FF1E2D] transition-colors">
                  Detection
                </a>
              </li>
              <li>
                <a href="#intelligence" className="hover:text-[#FF1E2D] transition-colors">
                  Intelligence
                </a>
              </li>
              <li>
                <a href="#forensics" className="hover:text-[#FF1E2D] transition-colors">
                  Forensics
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#FF1E2D] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#FF1E2D] transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Project */}
          <div className="md:col-span-4">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#F5F5F5] mb-4">
              Compliance & Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A3A3A3] font-medium">
              <li>
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="hover:text-[#FF1E2D] transition-colors cursor-pointer text-left"
                >
                  Privacy Policy (Google Limited Use)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="hover:text-[#FF1E2D] transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenContact}
                  className="hover:text-[#FF1E2D] transition-colors cursor-pointer text-left"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <span className="font-mono text-xs text-[#737373] block pt-1">
                  AI-Powered Cyber Defense & Incident Intelligence
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737373]">
          <p>© 2026 CyberTrace. All rights reserved. Enterprise Security Team.</p>
          <div className="flex items-center gap-6">
            <button type="button" onClick={onOpenPrivacy} className="hover:text-[#FF1E2D] cursor-pointer">
              Privacy
            </button>
            <button type="button" onClick={onOpenTerms} className="hover:text-[#FF1E2D] cursor-pointer">
              Terms
            </button>
            <button type="button" onClick={onOpenContact} className="hover:text-[#FF1E2D] cursor-pointer">
              Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
