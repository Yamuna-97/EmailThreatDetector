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
    <section id="ai-analysis" className="py-24 px-5 sm:px-8 bg-white border-b border-[#192837]/6">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: AI Methodology Description */}
          <div className="lg:col-span-6 text-left">
            <ScrollReveal delay={0.05}>
              <span className="text-xs font-bold uppercase tracking-widest text-[#7342E2] bg-[#7342E2]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
                Large Language Models & Deep Heuristics
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#192837] tracking-tight mb-5">
                How VaultShield AI Analyzes Every Incoming Email
              </h2>
              <p className="font-body text-base text-[#192837]/80 leading-relaxed mb-8">
                Traditional antispam filters rely on static blocklists that attackers easily evade. VaultShield pairs
                <strong> Gemini AI </strong> reasoning with deep semantic NLP to examine content nuances, sender behavior,
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
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 w-fit mb-5">
                  <Gauge size={14} />
                  <span>96.8% Threat Confidence</span>
                </div>

                {/* Threat Explanation Box */}
                <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#192837]/8 mb-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7342E2] mb-1.5">
                    <Sparkles size={14} /> AI-Generated Threat Explanation
                  </div>
                  <p className="text-xs text-[#192837]/85 leading-relaxed font-mono bg-white p-3 rounded-xl border border-[#192837]/6">
                    "This email exhibits high-severity coercion patterns. The sender domain <code>support-microsoff.com</code> is a newly registered typosquat mimicking Microsoft Cloud Operations. Language constructs demand immediate credential renewal within 15 minutes to prevent simulated service termination."
                  </p>
                </div>

                {/* Key Vector Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#192837]/70 font-medium">Psychological Pressure Vector</span>
                    <span className="font-bold text-rose-600">Urgency: Critical (98/100)</span>
                  </div>
                  <div className="w-full bg-[#192837]/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[98%] rounded-full" />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[#192837]/70 font-medium">Domain Spoofing Index</span>
                    <span className="font-bold text-amber-600">Similarity: 94%</span>
                  </div>
                  <div className="w-full bg-[#192837]/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[94%] rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#192837]/10 text-xs font-semibold text-[#192837]">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 size={15} /> Automated SOC Tagging Ready
                  </span>
                  <span className="text-[#7342E2]">FastAPI Telemetry Stream</span>
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
