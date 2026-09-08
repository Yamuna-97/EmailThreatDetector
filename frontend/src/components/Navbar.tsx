import React from 'react'
import Logo from './Logo'
import StaggeredMenu from './StaggeredMenu'
import { ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { InteractiveHoverButton } from './ui/interactive-hover-button'
import { ThemeToggle } from './ui/ThemeToggle'

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
  const { resolvedTheme } = useTheme()

  const isLight = resolvedTheme === 'light'
  const menuColors = isLight
    ? ['#F8F9FA', '#FFFFFF', '#E50914']
    : ['#050505', '#111111', '#E50914']
  const menuBtnColor = isLight ? '#0F172A' : '#F5F5F5'

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--bg-secondary-90)] backdrop-blur-md border-b border-[var(--border-primary)] transition-all">
      <nav
        className="max-w-[1280px] mx-auto px-5 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between"
        aria-label="Main Navigation"
      >
        {/* Left: Brand Identity */}
        <a href="#" className="flex items-center gap-3 group focus:outline-none" aria-label="CyberTrace Home">
          <Logo size={36} />
          <div className="flex flex-col">
            <span className="font-heading text-xl font-extrabold text-[var(--color-text-primary)] tracking-tight flex items-center">
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
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:text-[#FF1E2D] hover:bg-[var(--surface-raised)] transition-all cursor-pointer"
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
                className="hidden sm:inline-flex py-2 px-4 text-xs font-bold bg-[var(--surface-raised)] text-[var(--color-text-primary)] border-[var(--border-primary)] hover:border-[#E50914]"
              />

              <InteractiveHoverButton
                onClick={() => onOpenAuth ? onOpenAuth('signup') : null}
                text="Get Started"
                className="hidden sm:inline-flex py-2 px-5 text-xs font-bold bg-[#E50914] text-white border-[#E50914] hover:bg-[#FF1E2D]"
              />
            </>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Staggered Menu */}
          <div className="ml-1">
            <StaggeredMenu
              position="right"
              items={navLinks}
              socialItems={socialLinks}
              displaySocials={true}
              displayItemNumbering={true}
              colors={menuColors}
              accentColor="#E50914"
              menuButtonColor={menuBtnColor}
              openMenuButtonColor="#FF1E2D"
            />
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
