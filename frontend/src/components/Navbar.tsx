import React from 'react'
import Logo from './Logo'
import StaggeredMenu from './StaggeredMenu'
import { ShieldCheck } from 'lucide-react'

const navLinks = [
  { label: 'Detection', link: '#detection', ariaLabel: 'Go to Detection' },
  { label: 'Intelligence', link: '#intelligence', ariaLabel: 'Go to Intelligence' },
  { label: 'Forensics', link: '#forensics', ariaLabel: 'Go to Forensics' },
  { label: 'How It Works', link: '#how-it-works', ariaLabel: 'Go to How It Works' },
  { label: 'About', link: '#about', ariaLabel: 'Go to About' },
]

const socialLinks = [
  { label: 'SIH 2026 Portal', link: 'https://www.sih.gov.in/' },
  { label: 'FastAPI Backend', link: '#tech' },
  { label: 'Gemini AI Engine', link: '#ai-analysis' },
  { label: 'Threat Feeds', link: '#intelligence' },
]

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-[#192837]/8 transition-all">
      <nav
        className="max-w-[1280px] mx-auto px-5 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between"
        aria-label="Main Navigation"
      >
        {/* Left: Brand Identity */}
        <a href="#" className="flex items-center gap-3 group focus:outline-none" aria-label="VaultShield Home">
          <Logo size={32} />
          <div className="flex flex-col">
            <span className="font-heading text-xl font-bold text-[#192837] tracking-tight flex items-center gap-1.5">
              VaultShield
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#7342E2]/10 text-[#7342E2]">
                SIH 2026
              </span>
            </span>
          </div>
        </a>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.link}
              className="text-sm font-medium text-[#192837] opacity-80 hover:opacity-100 hover:text-[#7342E2] transition-all duration-200"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Right: Actions & Staggered Menu */}
        <div className="flex items-center gap-3">
          <a
            href="#dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#192837] bg-[#F2F2EE] hover:bg-[#e7e7e2] active:scale-95 transition-all shadow-sm"
          >
            <ShieldCheck size={14} className="text-[#7342E2]" />
            <span>Sign In</span>
          </a>

          <a
            href="#cta"
            className="hidden sm:inline-flex px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#7342E2] hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-[#7342E2]/20"
          >
            Get Started
          </a>

          {/* Staggered Menu from React Bits */}
          <div className="ml-1">
            <StaggeredMenu
              position="right"
              items={navLinks}
              socialItems={socialLinks}
              displaySocials={true}
              displayItemNumbering={true}
              colors={['#F7F6F3', '#EDE8F5', '#7342E2']}
              accentColor="#7342E2"
              menuButtonColor="#192837"
              openMenuButtonColor="#192837"
            />
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
