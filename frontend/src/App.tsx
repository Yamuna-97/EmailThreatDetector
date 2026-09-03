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
import Footer from './components/Footer'
import AuthForm from './components/ui/auth-form'

export const App: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  const handleCloseAuth = () => {
    setAuthOpen(false)
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
        {/* Conditional Auth Screen Overlay */}
        {authOpen ? (
          <AuthForm
            initialMode={authMode}
            onBack={handleCloseAuth}
            onSuccess={() => {
              handleCloseAuth()
            }}
          />
        ) : (
          <>
            {/* 1. NAVBAR */}
            <Navbar onOpenAuth={handleOpenAuth} />

            {/* 2. HERO: ONLY STARTING FULLSCREEN VIDEO + BIG MASKED HEADING + START NOW / SIGN IN */}
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

            {/* 14. FOOTER */}
            <Footer />
          </>
        )}
      </div>
    </ClickSpark>
  )
}

export default App
