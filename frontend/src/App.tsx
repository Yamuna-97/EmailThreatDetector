import React, { useState } from 'react'
import ClickSpark from './components/ClickSpark'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ThreatOverview from './components/ThreatOverview'
import IntelligenceMatrix from './components/IntelligenceMatrix'
import ThreatDetection from './components/ThreatDetection'
import AiAnalysis from './components/AiAnalysis'
import GeoIntelligence from './components/GeoIntelligence'
import Forensics from './components/Forensics'
import RiskScore from './components/RiskScore'
import EarlyWarning from './components/EarlyWarning'
import HowItWorks from './components/HowItWorks'
import DashboardPreview from './components/DashboardPreview'
import TechStack from './components/TechStack'
import About from './components/About'
import Footer from './components/Footer'
import AuthForm from './components/ui/auth-form'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import UserDashboard from './components/dashboard/UserDashboard'
import InvestigatorDashboard from './components/dashboard/InvestigatorDashboard'
import FloatingRAGChatWidget from './components/dashboard/FloatingRAGChatWidget'

import { PrivacyPolicy } from './components/pages/PrivacyPolicy'
import { TermsOfService } from './components/pages/TermsOfService'
import { ContactPage } from './components/pages/ContactPage'

type PublicPage = 'landing' | 'privacy' | 'terms' | 'contact'

const AppContent: React.FC = () => {
  const { isAuthenticated, role } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [forceLanding, setForceLanding] = useState(false)

  // Determine initial page & auth state from URL path or hash
  const parseCurrentUrl = () => {
    const path = window.location.pathname.toLowerCase()
    const hash = window.location.hash.toLowerCase()

    if (path.startsWith('/privacy') || hash === '#privacy') return { page: 'privacy' as PublicPage, auth: false, mode: 'signin' as const }
    if (path.startsWith('/terms') || hash === '#terms') return { page: 'terms' as PublicPage, auth: false, mode: 'signin' as const }
    if (path.startsWith('/contact') || hash === '#contact') return { page: 'contact' as PublicPage, auth: false, mode: 'signin' as const }
    if (path.startsWith('/signup') || path.startsWith('/register')) return { page: 'landing' as PublicPage, auth: true, mode: 'signup' as const }
    if (path.startsWith('/login') || path.startsWith('/signin')) return { page: 'landing' as PublicPage, auth: true, mode: 'signin' as const }
    return { page: 'landing' as PublicPage, auth: false, mode: 'signin' as const }
  }

  const initialUrlState = parseCurrentUrl()
  const [activePage, setActivePage] = useState<PublicPage>(initialUrlState.page)

  // Listen to popstate and hashchange for direct browser navigation and back/forward buttons
  React.useEffect(() => {
    const handleNavChange = () => {
      const current = parseCurrentUrl()
      setActivePage(current.page)
      if (current.auth) {
        setAuthMode(current.mode)
        setAuthOpen(true)
      } else {
        setAuthOpen(false)
      }
    }
    window.addEventListener('popstate', handleNavChange)
    window.addEventListener('hashchange', handleNavChange)
    return () => {
      window.removeEventListener('popstate', handleNavChange)
      window.removeEventListener('hashchange', handleNavChange)
    }
  }, [])

  const navigateTo = (pathOrPage: string) => {
    if (pathOrPage === 'privacy' || pathOrPage === '/privacy') {
      setActivePage('privacy')
      setAuthOpen(false)
      window.history.pushState(null, '', '/privacy')
    } else if (pathOrPage === 'terms' || pathOrPage === '/terms') {
      setActivePage('terms')
      setAuthOpen(false)
      window.history.pushState(null, '', '/terms')
    } else if (pathOrPage === 'contact' || pathOrPage === '/contact') {
      setActivePage('contact')
      setAuthOpen(false)
      window.history.pushState(null, '', '/contact')
    } else if (pathOrPage === 'signin' || pathOrPage === '/login' || pathOrPage === '/signin') {
      setAuthMode('signin')
      setAuthOpen(true)
      setActivePage('landing')
      window.history.pushState(null, '', '/login')
    } else if (pathOrPage === 'signup' || pathOrPage === '/signup' || pathOrPage === '/register') {
      setAuthMode('signup')
      setAuthOpen(true)
      setActivePage('landing')
      window.history.pushState(null, '', '/signup')
    } else {
      setActivePage('landing')
      setAuthOpen(false)
      window.history.pushState(null, '', '/')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    navigateTo(mode)
  }

  const handleCloseAuth = () => {
    setAuthOpen(false)
    window.history.pushState(null, '', '/')
  }

  // 1. Public compliance pages (accessible without login)
  if (activePage === 'privacy') {
    return (
      <PrivacyPolicy
        onBack={() => navigateTo('/')}
        onOpenTerms={() => navigateTo('/terms')}
        onOpenContact={() => navigateTo('/contact')}
      />
    )
  }

  if (activePage === 'terms') {
    return (
      <TermsOfService
        onBack={() => navigateTo('/')}
        onOpenPrivacy={() => navigateTo('/privacy')}
        onOpenContact={() => navigateTo('/contact')}
      />
    )
  }

  if (activePage === 'contact') {
    return (
      <ContactPage
        onBack={() => navigateTo('/')}
        onOpenPrivacy={() => navigateTo('/privacy')}
        onOpenTerms={() => navigateTo('/terms')}
      />
    )
  }

  // 2. Authenticated Dashboard console
  if (isAuthenticated && !forceLanding && !authOpen) {
    if (role === 'investigator' || role === 'admin') {
      return (
        <div>
          <InvestigatorDashboard />
          <FloatingRAGChatWidget />
        </div>
      )
    }

    return (
      <div>
        <UserDashboard />
        <FloatingRAGChatWidget />
      </div>
    )
  }

  return (
    <ClickSpark
      sparkColor="#FF1E2D"
      sparkSize={12}
      sparkRadius={24}
      sparkCount={10}
      duration={450}
      easing="ease-out"
      className="min-h-screen bg-[#050505]"
    >
      <div
        className="relative w-full min-h-screen flex flex-col bg-[#050505] text-[#F5F5F5] selection:bg-[#E50914]/25 selection:text-[#FF1E2D]"
        style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text-primary)',
        }}
      >
        {/* Return to console floating button if authenticated on landing */}
        {isAuthenticated && (
          <div className="fixed top-20 right-6 z-50">
            <button
              type="button"
              onClick={() => setForceLanding(false)}
              className="px-4 py-2 rounded-full bg-[#E50914] text-white text-xs font-bold shadow-lg shadow-[#E50914]/40 hover:bg-[#FF1E2D] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Return to {role === 'investigator' || role === 'admin' ? 'SOC Console' : 'Dashboard'}</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Conditional Auth Screen Overlay */}
        {authOpen ? (
          <AuthForm
            initialMode={authMode}
            onBack={handleCloseAuth}
            onSuccess={() => {
              handleCloseAuth()
              setForceLanding(false)
            }}
          />
        ) : (
          <>
            {/* 1. NAVBAR */}
            <Navbar
              onOpenAuth={handleOpenAuth}
              onGoToDashboard={() => setForceLanding(false)}
            />

            {/* 2. HERO */}
            <Hero onOpenAuth={handleOpenAuth} />

            {/* 3. THREAT OVERVIEW & DEFENSE PIPELINE */}
            <ThreatOverview />

            {/* 4. INTERACTIVE INTELLIGENCE MATRIX (MagicBento) */}
            <IntelligenceMatrix />

            {/* 5. THREAT DETECTION */}
            <ThreatDetection />

            {/* 6. AI ANALYSIS */}
            <AiAnalysis />

            {/* 7. GEOLOCATION & THREAT INTELLIGENCE */}
            <GeoIntelligence />

            {/* 8. FORENSIC INTELLIGENCE */}
            <Forensics />

            {/* 9. RISK SCORE ASSESSMENT */}
            <RiskScore />

            {/* 10. EARLY WARNING & INBOX TRIAGE */}
            <EarlyWarning />

            {/* 11. HOW IT WORKS */}
            <HowItWorks />

            {/* 12. DASHBOARD PREVIEW */}
            <DashboardPreview />

            {/* 13. TECH STACK */}
            <TechStack />

            {/* 14. ABOUT */}
            <About />

            {/* 15. FOOTER */}
            <Footer
              onOpenPrivacy={() => navigateTo('privacy')}
              onOpenTerms={() => navigateTo('terms')}
              onOpenContact={() => navigateTo('contact')}
            />
          </>
        )}

        {/* Global Floating RAG Assistant in Bottom Left Corner */}
        <FloatingRAGChatWidget />
      </div>
    </ClickSpark>
  )
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App
