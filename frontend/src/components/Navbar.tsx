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
    <header className="sticky top-0 z-40 w-full bg-[#050505]/90 backdrop-blur-md border-b border-[#2A2A2A] transition-all">
      <nav
        className="max-w-[1280px] mx-auto px-5 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between"
        aria-label="Main Navigation"
      >
        {/* Left: Brand Identity */}
        <a href="#" className="flex items-center gap-3 group focus:outline-none" aria-label="CyberTrace Home">
          <Logo size={36} />
          <div className="flex flex-col">
            <span className="font-heading text-xl font-extrabold text-[#F5F5F5] tracking-tight flex items-center">
              Cyber<span className="text-[#E50914]">Trace</span>
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
                icon={<LayoutDashboard size={14} className="text-[#FF1E2D]" />}
                className="py-1.5 px-4 text-xs font-bold bg-[#E50914] text-white border-[#E50914]"
              />

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#A3A3A3] hover:text-[#FF1E2D] hover:bg-[#181818] transition-all cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <InteractiveHoverButton
                onClick={() => onOpenAuth ? onOpenAuth('signin') : null}
                text="Sign In"
                icon={<ShieldCheck size={14} className="text-[#FF1E2D]" />}
                className="hidden sm:inline-flex py-2 px-4 text-xs font-bold bg-[#181818] text-[#F5F5F5] border-[#2A2A2A] hover:border-[#E50914]"
              />

              <InteractiveHoverButton
                onClick={() => onOpenAuth ? onOpenAuth('signup') : null}
                text="Get Started"
                className="hidden sm:inline-flex py-2 px-5 text-xs font-bold bg-[#E50914] text-white border-[#E50914] hover:bg-[#FF1E2D]"
              />
            </>
          )}

          {/* Staggered Menu */}
          <div className="ml-1">
            <StaggeredMenu
              position="right"
              items={navLinks}
              socialItems={socialLinks}
              displaySocials={true}
              displayItemNumbering={true}
              colors={['#050505', '#111111', '#E50914']}
              accentColor="#E50914"
              menuButtonColor="#F5F5F5"
              openMenuButtonColor="#FF1E2D"
            />
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
