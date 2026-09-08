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
    <div className="min-h-screen bg-[#FDFDFD] text-[#192837] font-body">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#192837]/10 px-5 sm:px-8 py-4">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InteractiveHoverButton
              onClick={onBack}
              text="Back to Home"
              icon={<ArrowLeft size={16} className="text-[#7342E2]" />}
              className="py-1.5 px-3 text-xs font-bold bg-[#F2F2EE] border-[#192837]/10"
            />
            <div className="flex items-center gap-2 border-l border-[#192837]/15 pl-3">
              <Logo size={28} />
              <span className="font-heading font-extrabold text-base tracking-tight text-[#192837]">
                Cyber<span className="text-[#7342E2]">Trace</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            {onOpenTerms && (
              <button onClick={onOpenTerms} className="hover:text-[#7342E2] transition-colors cursor-pointer">
                Terms of Service
              </button>
            )}
            {onOpenContact && (
              <button onClick={onOpenContact} className="hover:text-[#7342E2] transition-colors cursor-pointer">
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
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#7342E2]/10 text-[#7342E2] text-xs font-extrabold tracking-wide uppercase mb-3">
            <ShieldCheck size={14} />
            <span>Public Compliance & Security Disclosure</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#192837] tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#192837]/60 font-medium">
            Effective Date: September 2026 • Platform: CyberTrace / Email Threat Intelligence
          </p>
        </div>

        {/* Google API Limited Use Statement Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#7342E2]/8 to-[#8B5CF6]/5 border border-[#7342E2]/20 mb-12">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#7342E2] text-white shadow-sm mt-0.5">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-[#192837] mb-1">
                Google API Services User Data Policy & Limited Use Disclosure
              </h2>
              <p className="text-xs sm:text-sm text-[#192837]/80 leading-relaxed font-normal">
                CyberTrace's use and transfer of information received from Google APIs to any other app will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#7342E2] font-semibold underline inline-flex items-center gap-0.5"
                >
                  Google API Services User Data Policy <ExternalLink size={12} />
                </a>
                , including the <strong>Limited Use</strong> requirements.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#192837]/75">
                <span className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-[#7342E2]/15">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Never Sold to Third Parties
                </span>
                <span className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-[#7342E2]/15">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Never Used for Advertising
                </span>
                <span className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-[#7342E2]/15">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Never Used to Train Generalized AI Models
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Contents */}
        <div className="space-y-10 text-xs sm:text-sm text-[#192837]/85 leading-relaxed font-normal">
          {/* Section 1: Overview */}
          <section className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-[#192837]">1. Application Overview & Scope</h3>
            <p>
              CyberTrace (<strong>"Email Threat Intelligence"</strong>) is an AI-powered email security, geolocation, and forensic intelligence platform engineered to analyze authorized email messages for phishing, impersonation, business email compromise (BEC), malicious links, attachment risks, and routing anomalies.
            </p>
            <p>
              This Privacy Policy explains how our application accesses, collects, processes, stores, and protects your information when you access our platform or connect your Google Workspace / Gmail account.
            </p>
          </section>

          {/* Section 2: Google Data */}
          <section className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-[#192837]">2. Google Account & Gmail Data Accessed</h3>
            <p>
              When you explicitly authorize Google OAuth 2.0 connection, CyberTrace requests access only to the narrowest necessary scopes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <code className="bg-[#F2F2EE] px-1.5 py-0.5 rounded text-xs font-mono">https://www.googleapis.com/auth/gmail.readonly</code>: Used solely to read email headers, subjects, sender/recipient addresses, message snippets, and body text required to perform automated threat analysis and security risk scoring.
              </li>
              <li>
                <code className="bg-[#F2F2EE] px-1.5 py-0.5 rounded text-xs font-mono">https://www.googleapis.com/auth/userinfo.email</code>: Used to verify and display the connected account email address.
              </li>
              <li>
                <code className="bg-[#F2F2EE] px-1.5 py-0.5 rounded text-xs font-mono">https://www.googleapis.com/auth/userinfo.profile</code>: Used to personalize your account profile and display name.
              </li>
            </ul>
            <p className="font-semibold text-[#192837]">
              We do NOT request or use write permissions (<code className="font-mono">gmail.modify</code>, <code className="font-mono">gmail.send</code>, or <code className="font-mono">gmail.compose</code>). We never modify, delete, or send emails on your behalf.
            </p>
          </section>

          {/* Section 3: Information Collected */}
          <section className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-[#192837]">3. Specific Information Processed</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-[#F8F8F6] border border-[#192837]/10">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#7342E2] mb-2 flex items-center gap-1.5">
                  <Eye size={14} /> Email Security Data
                </h4>
                <ul className="text-xs space-y-1.5 text-[#192837]/80">
                  <li>• Sender (<code className="font-mono">From:</code>) & Recipient (<code className="font-mono">To:</code>) headers</li>
                  <li>• Email Subject line and timestamp</li>
                  <li>• Authentication headers: SPF, DKIM, DMARC</li>
                  <li>• Hyperlinks and URLs extracted from message text</li>
                  <li>• Attachment metadata: filename, extension, file size</li>
                  <li>• Originating & relay IP addresses from <code className="font-mono">Received:</code> headers</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#F8F8F6] border border-[#192837]/10">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#7342E2] mb-2 flex items-center gap-1.5">
                  <Database size={14} /> Threat Intelligence & AI Outputs
                </h4>
                <ul className="text-xs space-y-1.5 text-[#192837]/80">
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
          <section className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-[#192837]">4. AI & Gemini Processing Disclosure</h3>
            <p>
              CyberTrace utilizes Google Gemini API and specialized scikit-learn machine learning models to inspect email text and technical indicators for adversarial manipulation, impersonation tactics, credential-harvesting patterns, and malicious intent.
            </p>
            <p>
              Email content sent to the Gemini API is processed transiently strictly for generating real-time threat explanations, IOC indicators, and forensic recommendations for your security dashboard. Your email data is not used by CyberTrace to train global foundation AI models.
            </p>
          </section>

          {/* Section 5: Approximate IP Geolocation */}
          <section className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-[#192837]">5. Approximate IP Geolocation Disclosure</h3>
            <p>
              IP geolocation information displayed on the threat map and investigator dashboard represents <strong>approximate routing location</strong> based on public IP registry data (Country, Region, City, Autonomous System Number).
            </p>
            <p className="bg-[#F8F8F6] p-3 rounded-xl border border-[#192837]/10 text-xs">
              <strong>Notice:</strong> IP geolocation identifies the mail relay server, proxy, or VPN exit point utilized in message transport, and does not disclose the precise physical street address or GPS location of an individual sender.
            </p>
          </section>

          {/* Section 6: Third-Party Data Processors */}
          <section className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-[#192837]">6. Third-Party Service Providers</h3>
            <p>
              We disclose user data only to the minimal service providers strictly required to operate the platform infrastructure:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-[#192837]/10 rounded-xl overflow-hidden">
                <thead className="bg-[#F2F2EE] text-[#192837] font-bold">
                  <tr>
                    <th className="p-2.5 border-b border-[#192837]/10">Service Provider</th>
                    <th className="p-2.5 border-b border-[#192837]/10">Purpose</th>
                    <th className="p-2.5 border-b border-[#192837]/10">Data Transferred</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#192837]/10">
                  <tr>
                    <td className="p-2.5 font-semibold">Google Workspace / Gmail API</td>
                    <td className="p-2.5">Email ingestion & OAuth authentication</td>
                    <td className="p-2.5">OAuth tokens & read requests</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">Google Gemini AI API</td>
                    <td className="p-2.5">Real-time threat analysis & IOC extraction</td>
                    <td className="p-2.5">Email snippet, subject, extracted headers</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">Supabase PostgreSQL</td>
                    <td className="p-2.5">Encrypted database storage & Auth</td>
                    <td className="p-2.5">User profile, scan logs, threat metrics</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">IPQualityScore</td>
                    <td className="p-2.5">IP fraud, proxy & VPN reputation checking</td>
                    <td className="p-2.5">Extracted relay IP addresses</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">IP Geolocation Service (ipapi)</td>
                    <td className="p-2.5">Approximate geographic mapping</td>
                    <td className="p-2.5">Extracted relay IP addresses</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 7: Token Security & Storage */}
          <section className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-[#192837]">7. Token Security & Storage</h3>
            <p>
              OAuth access tokens and refresh tokens are stored securely in backend Supabase PostgreSQL databases protected by Row-Level Security (RLS). Tokens and client secrets are never exposed in frontend bundles, never printed to client-side logs, and never returned in API payloads.
            </p>
          </section>

          {/* Section 8: Disconnect & Data Deletion */}
          <section className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-[#192837]">8. Gmail Disconnection & Complete Data Deletion</h3>
            <p>You retain full control over your data at all times:</p>
            <div className="space-y-2">
              <div className="p-3.5 rounded-xl bg-white border border-[#192837]/10 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700 mt-0.5">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#192837]">Disconnect Gmail</h4>
                  <p className="text-xs text-[#192837]/75">
                    Clicking "Disconnect Account" in Profile & Settings stops all automated monitoring, clears tokens from active memory, revokes credentials with Google authorization servers, and sets the account to disconnected.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#192837]/10 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-50 text-red-700 mt-0.5">
                  <Trash2 size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#192837]">Delete My Stored Threat Data</h4>
                  <p className="text-xs text-[#192837]/75">
                    Clicking "Delete Stored Threat Data" in Profile & Settings permanently purges all your scanned emails, threat logs, alert records, and Gmail connection metadata from the database.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9: Contact */}
          <section className="space-y-3 pt-4 border-t border-[#192837]/10">
            <h3 className="font-heading text-lg font-bold text-[#192837]">9. Contact Information</h3>
            <p>
              For privacy inquiries, data deletion requests, or questions regarding our security architecture, please contact our administrative team:
            </p>
            <div className="p-4 rounded-xl bg-[#F8F8F6] border border-[#192837]/10 flex items-center gap-3">
              <Mail size={18} className="text-[#7342E2]" />
              <div>
                <p className="text-xs font-bold text-[#192837]">CyberTrace Enterprise Security Support</p>
                <p className="text-xs text-[#7342E2] font-semibold">admin@cybertrace.local</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default PrivacyPolicy
