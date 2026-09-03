import React from 'react'
import ClickSpark from './components/ClickSpark'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
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

export const App: React.FC = () => {
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
        {/* 1. NAVBAR */}
        <Navbar />

        {/* 2. HERO (Fullscreen Background Video with Left MaskedHeading) */}
        <Hero />

        {/* 3. INTERACTIVE INTELLIGENCE MATRIX (MagicBento) */}
        <IntelligenceMatrix />

        {/* 4. THREAT DETECTION */}
        <ThreatDetection />

        {/* 5. AI ANALYSIS */}
        <AiAnalysis />

        {/* 6. GEOLOCATION & THREAT INTELLIGENCE */}
        <GeoIntelligence />

        {/* 7. FORENSIC INTELLIGENCE */}
        <Forensics />

        {/* 8. RISK SCORE ASSESSMENT */}
        <RiskScore />

        {/* 9. EARLY WARNING & INBOX TRIAGE */}
        <EarlyWarning />

        {/* 10. HOW IT WORKS */}
        <HowItWorks />

        {/* 11. DASHBOARD PREVIEW */}
        <DashboardPreview />

        {/* 12. TECH STACK */}
        <TechStack />

        {/* 13. FOOTER */}
        <Footer />
      </div>
    </ClickSpark>
  )
}

export default App
