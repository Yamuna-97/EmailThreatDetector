import React from 'react'
import { ShieldCheck, Lock, ExternalLink, ArrowLeft, Database, Eye, Trash2, Mail, CheckCircle2 } from 'lucide-react'
import Logo from '../Logo'
import { InteractiveHoverButton } from '../ui/interactive-hover-button'

interface PolicyPageProps {
  onBack: () => void
  onOpenTerms?: () => void
  onOpenContact?: () => void
}

export const PrivacyPolicy: React.FC<PolicyPageProps> = ({ onBack, onOpenTerms, onOpenContact }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] font-body">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#2A2A2A] px-5 sm:px-8 py-4">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InteractiveHoverButton
              onClick={onBack}
              text="Back to Home"
              icon={<ArrowLeft size={16} className="text-[#FF1E2D]" />}
              className="py-1.5 px-3 text-xs font-bold bg-[#181818] border-[#2A2A2A] text-[#F5F5F5]"
            />
            <div className="flex items-center gap-2 border-l border-[#2A2A2A] pl-3">
              <Logo size={28} />
              <span className="font-heading font-black text-base tracking-tight text-[#F5F5F5]">
                Cyber<span className="text-[#FF1E2D]">Trace</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            {onOpenTerms && (
              <button onClick={onOpenTerms} className="text-[#A3A3A3] hover:text-[#FF1E2D] transition-colors cursor-pointer">
                Terms of Service
              </button>
            )}
            {onOpenContact && (
              <button onClick={onOpenContact} className="text-[#A3A3A3] hover:text-[#FF1E2D] transition-colors cursor-pointer">
                Contact
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[900px] mx-auto px-5 sm:px-8 py-12 sm:py-16 text-left">
        {/* Title Badge & Heading */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FF1E2D]/10 text-[#FF1E2D] border border-[#FF1E2D]/30 text-xs font-mono font-bold tracking-wide uppercase mb-3">
            <ShieldCheck size={14} />
            <span>Public Compliance & Security Disclosure</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-[#F5F5F5] tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#737373] font-mono">
            Effective Date: September 2026 • Platform: CyberTrace / Email Threat Intelligence
          </p>
        </div>

        {/* Google API Limited Use Statement Card */}
        <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-[#2A2A2A] mb-12 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#E50914] text-white shadow-md shadow-[#E50914]/20 mt-0.5">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-[#F5F5F5] mb-1">
                Google API Services User Data Policy & Limited Use Disclosure
              </h2>
              <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed font-normal">
                CyberTrace's use and transfer of information received from Google APIs to any other app will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF1E2D] font-semibold underline inline-flex items-center gap-0.5 hover:text-white"
                >
                  Google API Services User Data Policy <ExternalLink size={12} />
                </a>
                , including the <strong className="text-[#F5F5F5]">Limited Use</strong> requirements.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#F5F5F5]">
                <span className="inline-flex items-center gap-1.5 bg-[#111111] px-3 py-1 rounded-lg border border-[#2A2A2A]">
                  <CheckCircle2 size={13} className="text-emerald-400" /> Never Sold to Third Parties
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#111111] px-3 py-1 rounded-lg border border-[#2A2A2A]">
                  <CheckCircle2 size={13} className="text-emerald-400" /> Never Used for Advertising
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#111111] px-3 py-1 rounded-lg border border-[#2A2A2A]">
                  <CheckCircle2 size={13} className="text-emerald-400" /> Never Used to Train Generalized AI Models
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Contents */}
        <div className="space-y-10 text-xs sm:text-sm text-[#A3A3A3] leading-relaxed font-normal">
          {/* Section 1: Overview */}
          <section className="space-y-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">1. Application Overview & Scope</h3>
            <p>
              CyberTrace (<strong className="text-[#F5F5F5]">"Email Threat Intelligence"</strong>) is an AI-powered email security, geolocation, and forensic intelligence platform engineered to analyze authorized email messages for phishing, impersonation, business email compromise (BEC), malicious links, attachment risks, and routing anomalies.
            </p>
            <p>
              This Privacy Policy explains how our application accesses, collects, processes, stores, and protects your information when you access our platform or connect your Google Workspace / Gmail account.
            </p>
          </section>

          {/* Section 2: Google Data */}
          <section className="space-y-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">2. Google Account & Gmail Data Accessed</h3>
            <p>
              When you explicitly authorize Google OAuth 2.0 connection, CyberTrace requests access only to the narrowest necessary scopes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <code className="bg-[#181818] border border-[#2A2A2A] text-[#FF1E2D] px-1.5 py-0.5 rounded text-xs font-mono">https://www.googleapis.com/auth/gmail.readonly</code>: Used solely to read email headers, subjects, sender/recipient addresses, message snippets, and body text required to perform automated threat analysis and security risk scoring.
              </li>
              <li>
                <code className="bg-[#181818] border border-[#2A2A2A] text-[#FF1E2D] px-1.5 py-0.5 rounded text-xs font-mono">https://www.googleapis.com/auth/userinfo.email</code>: Used to verify and display the connected account email address.
              </li>
              <li>
                <code className="bg-[#181818] border border-[#2A2A2A] text-[#FF1E2D] px-1.5 py-0.5 rounded text-xs font-mono">https://www.googleapis.com/auth/userinfo.profile</code>: Used to personalize your account profile and display name.
              </li>
            </ul>
            <p className="font-semibold text-[#F5F5F5]">
              We do NOT request or use write permissions (<code className="font-mono bg-[#181818] px-1 rounded border border-[#2A2A2A]">gmail.modify</code>, <code className="font-mono bg-[#181818] px-1 rounded border border-[#2A2A2A]">gmail.send</code>, or <code className="font-mono bg-[#181818] px-1 rounded border border-[#2A2A2A]">gmail.compose</code>). We never modify, delete, or send emails on your behalf.
            </p>
          </section>

          {/* Section 3: Information Collected */}
          <section className="space-y-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">3. Specific Information Processed</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-[#111111] border border-[#2A2A2A]">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#FF1E2D] mb-2 flex items-center gap-1.5">
                  <Eye size={14} /> Email Security Data
                </h4>
                <ul className="text-xs space-y-1.5 text-[#A3A3A3]">
                  <li>• Sender (<code className="font-mono text-[#F5F5F5]">From:</code>) & Recipient (<code className="font-mono text-[#F5F5F5]">To:</code>) headers</li>
                  <li>• Email Subject line and timestamp</li>
                  <li>• Authentication headers: SPF, DKIM, DMARC</li>
                  <li>• Hyperlinks and URLs extracted from message text</li>
                  <li>• Attachment metadata: filename, extension, file size</li>
                  <li>• Originating & relay IP addresses from <code className="font-mono text-[#F5F5F5]">Received:</code> headers</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#111111] border border-[#2A2A2A]">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#FF1E2D] mb-2 flex items-center gap-1.5">
                  <Database size={14} /> Threat Intelligence & AI Outputs
                </h4>
                <ul className="text-xs space-y-1.5 text-[#A3A3A3]">
                  <li>• IP Quality Score reputation & VPN/proxy detection</li>
                  <li>• Approximate IP geolocation (Country, City, ASN)</li>
                  <li>• ML threat classification (Phishing vs Legitimate)</li>
                  <li>• Gemini AI threat explanation & forensic IOC summary</li>
                  <li>• Aggregate risk score (0–100 scale) & severity tags</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: AI & Gemini Processing */}
          <section className="space-y-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">4. AI & Gemini Processing Disclosure</h3>
            <p>
              CyberTrace utilizes Google Gemini API and specialized scikit-learn machine learning models to inspect email text and technical indicators for adversarial manipulation, impersonation tactics, credential-harvesting patterns, and malicious intent.
            </p>
            <p>
              Email content sent to the Gemini API is processed transiently strictly for generating real-time threat explanations, IOC indicators, and forensic recommendations for your security dashboard. Your email data is not used by CyberTrace to train global foundation AI models.
            </p>
          </section>

          {/* Section 5: Approximate IP Geolocation */}
          <section className="space-y-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">5. Approximate IP Geolocation Disclosure</h3>
            <p>
              IP geolocation information displayed on the threat map and investigator dashboard represents <strong className="text-[#F5F5F5]">approximate routing location</strong> based on public IP registry data (Country, Region, City, Autonomous System Number).
            </p>
            <p className="bg-[#111111] p-3 rounded-xl border border-[#2A2A2A] text-xs text-[#A3A3A3]">
              <strong className="text-[#F5F5F5]">Notice:</strong> IP geolocation identifies the mail relay server, proxy, or VPN exit point utilized in message transport, and does not disclose the precise physical street address or GPS location of an individual sender.
            </p>
          </section>

          {/* Section 6: Third-Party Data Processors */}
          <section className="space-y-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">6. Third-Party Service Providers</h3>
            <p>
              We disclose user data only to the minimal service providers strictly required to operate the platform infrastructure:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-[#2A2A2A] rounded-xl overflow-hidden font-mono">
                <thead className="bg-[#111111] text-[#F5F5F5] font-bold">
                  <tr>
                    <th className="p-2.5 border-b border-[#2A2A2A]">Service Provider</th>
                    <th className="p-2.5 border-b border-[#2A2A2A]">Purpose</th>
                    <th className="p-2.5 border-b border-[#2A2A2A]">Data Transferred</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A] text-[#A3A3A3]">
                  <tr>
                    <td className="p-2.5 font-semibold text-[#F5F5F5]">Google Workspace / Gmail API</td>
                    <td className="p-2.5">Email ingestion & OAuth authentication</td>
                    <td className="p-2.5">OAuth tokens & read requests</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-[#F5F5F5]">Google Gemini AI API</td>
                    <td className="p-2.5">Real-time threat analysis & IOC extraction</td>
                    <td className="p-2.5">Email snippet, subject, extracted headers</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-[#F5F5F5]">Supabase PostgreSQL</td>
                    <td className="p-2.5">Encrypted database storage & Auth</td>
                    <td className="p-2.5">User profile, scan logs, threat metrics</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-[#F5F5F5]">IPQualityScore</td>
                    <td className="p-2.5">IP fraud, proxy & VPN reputation checking</td>
                    <td className="p-2.5">Extracted relay IP addresses</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-[#F5F5F5]">IP Geolocation Service (ipapi)</td>
                    <td className="p-2.5">Approximate geographic mapping</td>
                    <td className="p-2.5">Extracted relay IP addresses</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 7: Token Security & Storage */}
          <section className="space-y-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">7. Token Security & Storage</h3>
            <p>
              OAuth access tokens and refresh tokens are stored securely in backend Supabase PostgreSQL databases protected by Row-Level Security (RLS). Tokens and client secrets are never exposed in frontend bundles, never printed to client-side logs, and never returned in API payloads.
            </p>
          </section>

          {/* Section 8: Disconnect & Data Deletion */}
          <section className="space-y-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">8. Gmail Disconnection & Complete Data Deletion</h3>
            <p>You retain full control over your data at all times:</p>
            <div className="space-y-2">
              <div className="p-3.5 rounded-xl bg-[#111111] border border-[#2A2A2A] flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-950/40 text-amber-400 border border-amber-800/40 mt-0.5">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#F5F5F5]">Disconnect Gmail</h4>
                  <p className="text-xs text-[#A3A3A3]">
                    Clicking "Disconnect Account" in Profile & Settings stops all automated monitoring, clears tokens from active memory, revokes credentials with Google authorization servers, and sets the account to disconnected.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111111] border border-[#2A2A2A] flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#FF1E2D]/15 text-[#FF1E2D] border border-[#FF1E2D]/30 mt-0.5">
                  <Trash2 size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#FF1E2D]">Delete My Stored Threat Data</h4>
                  <p className="text-xs text-[#A3A3A3]">
                    Clicking "Delete Stored Threat Data" in Profile & Settings permanently purges all your scanned emails, threat logs, alert records, and Gmail connection metadata from the database.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9: Contact */}
          <section className="space-y-3 pt-4 border-t border-[#2A2A2A]">
            <h3 className="font-heading text-lg font-bold text-[#F5F5F5]">9. Contact Information</h3>
            <p>
              For privacy inquiries, data deletion requests, or questions regarding our security architecture, please contact our administrative team:
            </p>
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#2A2A2A] flex items-center gap-3">
              <Mail size={18} className="text-[#FF1E2D]" />
              <div>
                <p className="text-xs font-bold text-[#F5F5F5]">CyberTrace Enterprise Security Support</p>
                <p className="text-xs text-[#FF1E2D] font-mono font-semibold">admin@cybertrace.local</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default PrivacyPolicy
