import React from 'react'
import Card from './Card'
import ScrollReveal from './ScrollReveal'
import {
  Brain,
  Sparkles,
  FileSearch,
  Fingerprint,
  MessageSquareWarning,
  Flame,
  Gauge,
  CheckCircle2,
} from 'lucide-react'

const aiFeatures = [
  {
    title: 'Email Content Analysis',
    badge: 'CONTENT NLP',
    icon: FileSearch,
    desc: 'Deep inspection of message body tokens, embedded markup, hidden HTML attributes, and obfuscated text scripts.',
  },
  {
    title: 'Sender Identity Analysis',
    badge: 'IDENTITY TRACE',
    icon: Fingerprint,
    desc: 'Cross-verifies historical communication frequency, DKIM cryptographic seals, and domain age to spot impersonators.',
  },
  {
    title: 'NLP-Based Threat Detection',
    badge: 'TRANSFORMERS',
    icon: Brain,
    desc: 'Transformer-based neural models parse semantic intent to isolate zero-day lures that bypass signature-based filters.',
  },
  {
    title: 'Suspicious Language & Urgency',
    badge: 'URGENCY METRICS',
    icon: MessageSquareWarning,
    desc: 'Evaluates psychological coercion, artificial deadlines ("Act within 1 hour"), and emotional manipulation phrases.',
  },
  {
    title: 'Intent & Action Extraction',
    badge: 'INTENT CLASSIFIER',
    icon: Flame,
    desc: 'Discovers whether the email is attempting to elicit credentials, trigger banking transactions, or install binaries.',
  },
  {
    title: 'AI-Generated Explanations',
    badge: 'EXPLAINABLE AI',
    icon: Sparkles,
    desc: 'Generates plain-English threat summaries explaining exactly why an email was classified as dangerous for SOC teams.',
  },
]

export const AiAnalysis: React.FC = () => {
  return (
    <section id="ai-analysis" className="py-24 px-5 sm:px-8 bg-[#050505] border-b border-[#2A2A2A]">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: AI Methodology Description */}
          <div className="lg:col-span-6 text-left">
            <ScrollReveal delay={0.05}>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF1E2D] bg-[#E50914]/12 border border-[#E50914]/30 px-3.5 py-1.5 rounded-full inline-block mb-3">
                Large Language Models & Deep Heuristics
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight mb-5">
                How CyberTrace AI Analyzes Every Incoming Email
              </h2>
              <p className="font-body text-base text-[#A3A3A3] leading-relaxed mb-8">
                Traditional antispam filters rely on static blocklists that attackers easily evade. CyberTrace pairs
                <strong className="text-[#F5F5F5]"> Gemini AI </strong> reasoning with deep semantic NLP to examine content nuances, sender behavior,
                and contextual anomalies in real time.
              </p>
            </ScrollReveal>

            {/* Feature Checklist using unified Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {aiFeatures.map((item, idx) => (
                <ScrollReveal key={item.title} delay={0.08 * idx} yOffset={25}>
                  <Card
                    badge={item.badge}
                    title={item.title}
                    description={item.desc}
                    className="p-4 rounded-2xl"
                  />
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive AI Output Card */}
          <div className="lg:col-span-6">
            <ScrollReveal delay={0.2} yOffset={40} scaleStart={0.93}>
              <Card
                badge="GEMINI AI VERDICT"
                title="AI Threat Classification"
                description="NLP Intent Analysis Engine • 96.8% Model Confidence"
                className="p-7 sm:p-9 text-left shadow-2xl"
              >
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/40 text-red-300 border border-red-800/60 text-xs font-bold font-mono w-fit mb-5">
                  <Gauge size={14} className="text-[#FF1E2D]" />
                  <span>96.8% Threat Confidence</span>
                </div>

                {/* Threat Explanation Box */}
                <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] mb-5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#FF1E2D] mb-1.5">
                    <Sparkles size={14} /> AI-Generated Threat Explanation
                  </div>
                  <p className="text-xs text-[#F5F5F5] leading-relaxed font-mono bg-[#111111] p-3 rounded-xl border border-[#2A2A2A]">
                    "This email exhibits high-severity coercion patterns. The sender domain <code className="text-[#FF1E2D]">support-microsoff.com</code> is a newly registered typosquat mimicking Microsoft Cloud Operations. Language constructs demand immediate credential renewal within 15 minutes to prevent simulated service termination."
                  </p>
                </div>

                {/* Key Vector Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A3A3A3] font-medium">Psychological Pressure Vector</span>
                    <span className="font-mono font-bold text-[#FF1E2D]">Urgency: Critical (98/100)</span>
                  </div>
                  <div className="w-full bg-[#1F1F1F] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#E50914] h-full w-[98%] rounded-full" />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[#A3A3A3] font-medium">Domain Spoofing Index</span>
                    <span className="font-mono font-bold text-amber-500">Similarity: 94%</span>
                  </div>
                  <div className="w-full bg-[#1F1F1F] h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[94%] rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A] text-xs font-semibold text-[#A3A3A3]">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                    <CheckCircle2 size={15} /> Automated SOC Tagging Ready
                  </span>
                  <span className="font-mono text-[#FF1E2D]">FastAPI Telemetry Stream</span>
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AiAnalysis
