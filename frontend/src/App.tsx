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
import FinalCTA from './components/FinalCTA'
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

        {/* 2. HERO SECTION (With Big Full-Screen ScrollExpand Video Stage & Left MaskedHeading) */}
        <Hero />

        {/* INTERACTIVE MAGIC BENTO SECTION (White & Purple Light Grid) */}
        <IntelligenceMatrix />

        {/* 3. THREAT DETECTION SECTION */}
        <ThreatDetection />

        {/* 4. AI ANALYSIS SECTION */}
        <AiAnalysis />

        {/* 5. GEOLOCATION & THREAT INTELLIGENCE SECTION */}
        <GeoIntelligence />

        {/* 6. FORENSIC INTELLIGENCE SECTION */}
        <Forensics />

        {/* 7. RISK SCORE SECTION */}
        <RiskScore />

        {/* 8. EARLY WARNING SECTION */}
        <EarlyWarning />

        {/* 9. HOW IT WORKS SECTION */}
        <HowItWorks />

        {/* 10. DASHBOARD PREVIEW SECTION */}
        <DashboardPreview />

        {/* 11. TRUST / TECHNOLOGY SECTION */}
        <TechStack />

        {/* 12. FINAL CTA SECTION */}
        <FinalCTA />

        {/* 13. FOOTER */}
        <Footer />
      </div>
    </ClickSpark>
  )
}

export default App
