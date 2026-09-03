import React from 'react'
import Logo from './Logo'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#192837]/10 py-16 px-5 sm:px-8 text-left">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#192837]/10">
          {/* Brand Info */}
          <div className="md:col-span-5 flex flex-col items-start">
            <div className="flex items-center gap-2.5 mb-4">
              <Logo size={28} />
              <span className="font-heading text-xl font-bold text-[#192837]">VaultShield</span>
            </div>
            <p className="font-body text-xs sm:text-sm text-[#192837]/70 leading-relaxed max-w-sm mb-4">
              AI-Powered Email Threat Detection, Geolocation and Forensic Intelligence Platform engineered for
              Smart India Hackathon (SIH) 2026.
            </p>
            <span className="text-xs font-bold text-[#7342E2] bg-[#7342E2]/10 px-3 py-1 rounded-full">
              SIH 2026 Project
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
                <a href="#ai-analysis" className="hover:text-[#7342E2] transition-colors">
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
                <a href="#privacy" className="hover:text-[#7342E2] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-[#7342E2] transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#7342E2] transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <span className="text-xs text-[#192837]/50 block pt-1">
                  Built for SIH 2026 • AI-Powered Cyber Defense
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#192837]/60">
          <p>© 2026 VaultShield. All rights reserved. SIH 2026 Innovation Team.</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-[#7342E2]">Privacy</a>
            <a href="#terms" className="hover:text-[#7342E2]">Terms</a>
            <a href="#contact" className="hover:text-[#7342E2]">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
