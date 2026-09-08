import React from 'react'
import Logo from './Logo'
import StaggeredMenu from './StaggeredMenu'
import { ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { InteractiveHoverButton } from './ui/interactive-hover-button'

const navLinks = [
  { label: 'Detection', link: '#detection', ariaLabel: 'Go to Detection' },
  { label: 'Intelligence', link: '#intelligence', ariaLabel: 'Go to Intelligence' },
  { label: 'Forensics', link: '#forensics', ariaLabel: 'Go to Forensics' },
  { label: 'How It Works', link: '#how-it-works', ariaLabel: 'Go to How It Works' },
  { label: 'About', link: '#about', ariaLabel: 'Go to About' },
]

const socialLinks = [
  { label: 'Security Documentation', link: '#about' },
  { label: 'FastAPI Backend', link: '#tech' },
  { label: 'Gemini AI Engine', link: '#ai-analysis' },
  { label: 'Threat Feeds', link: '#intelligence' },
]

export interface NavbarProps {
  onOpenAuth?: (mode: 'signin' | 'signup') => void
  onGoToDashboard?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onGoToDashboard }) => {
  const { isAuthenticated, role, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-[#192837]/8 transition-all">
      <nav
        className="max-w-[1280px] mx-auto px-5 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between"
        aria-label="Main Navigation"
      >
        {/* Left: Brand Identity */}
        <a href="#" className="flex items-center gap-3 group focus:outline-none" aria-label="CyberTrace Home">
          <Logo size={36} />
          <div className="flex flex-col">
            <span className="font-heading text-xl font-extrabold text-[#192837] tracking-tight flex items-center">
              Cyber<span className="text-[#7342E2]">Trace</span>
            </span>
          </div>
        </a>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <InteractiveHoverButton
                onClick={onGoToDashboard}
                text={role === 'investigator' || role === 'admin' ? 'SOC Console' : 'Dashboard'}
                icon={<LayoutDashboard size={14} className="text-[#7342E2]" />}
                className="py-1.5 px-4 text-xs font-bold"
              />

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#192837]/60 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <InteractiveHoverButton
                onClick={() => onOpenAuth ? onOpenAuth('signin') : null}
                text="Sign In"
                icon={<ShieldCheck size={14} className="text-[#7342E2]" />}
                className="hidden sm:inline-flex py-2 px-4 text-xs font-bold bg-[#F2F2EE]/80 text-[#192837] border-[#192837]/10"
              />

              <InteractiveHoverButton
                onClick={() => onOpenAuth ? onOpenAuth('signup') : null}
                text="Get Started"
                className="hidden sm:inline-flex py-2 px-5 text-xs font-bold bg-[#7342E2] text-white border-[#7342E2]"
              />
            </>
          )}

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
