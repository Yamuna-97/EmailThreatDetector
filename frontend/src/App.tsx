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
import UserDashboard from './components/dashboard/UserDashboard'
import InvestigatorDashboard from './components/dashboard/InvestigatorDashboard'

const AppContent: React.FC = () => {
  const { isAuthenticated, role } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [forceLanding, setForceLanding] = useState(false)

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  const handleCloseAuth = () => {
    setAuthOpen(false)
  }

  // If user is authenticated and not explicitly viewing the public landing page:
  if (isAuthenticated && !forceLanding) {
    if (role === 'investigator' || role === 'admin') {
      return (
        <div>
          {/* Quick Floating Switch to Landing View */}
          <div className="fixed bottom-4 right-4 z-50">
            <button
              type="button"
              onClick={() => setForceLanding(true)}
              className="px-3 py-1.5 rounded-full bg-[#192837] text-white text-[11px] font-bold shadow-lg border border-white/10 hover:bg-[#7342E2] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>View Landing Page</span>
            </button>
          </div>
          <InvestigatorDashboard />
        </div>
      )
    }

    return (
      <div>
        <div className="fixed bottom-4 right-4 z-50">
          <button
            type="button"
            onClick={() => setForceLanding(true)}
            className="px-3 py-1.5 rounded-full bg-[#192837] text-white text-[11px] font-bold shadow-lg border border-white/10 hover:bg-[#7342E2] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>View Landing Page</span>
          </button>
        </div>
        <UserDashboard />
      </div>
    )
  }

  return (
    <ClickSpark
      sparkColor="#7342E2"
      sparkSize={12}
      sparkRadius={24}
      sparkCount={10}
      duration={450}
      easing="ease-out"
      className="min-h-screen bg-[#FFFFFF]"
    >
      <div
        className="relative w-full min-h-screen flex flex-col bg-[#FFFFFF] text-[#192837] selection:bg-[#7342E2]/15 selection:text-[#7342E2]"
        style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text)',
        }}
      >
        {/* Return to console floating button if authenticated on landing */}
        {isAuthenticated && (
          <div className="fixed top-20 right-6 z-50">
            <button
              type="button"
              onClick={() => setForceLanding(false)}
              className="px-4 py-2 rounded-full bg-[#7342E2] text-white text-xs font-bold shadow-lg shadow-[#7342E2]/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
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
            <Footer />
          </>
        )}
      </div>
    </ClickSpark>
  )
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
