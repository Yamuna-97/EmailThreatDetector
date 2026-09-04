# 🛡️ VaultShield – AI-Powered Email Threat Detection, GeoLocation & Forensic Intelligence Platform

> **Smart India Hackathon (SIH 2026)**
> Advanced Enterprise-Grade Cybersecurity Solution for Real-Time Email Threat Hunting, Domain & IP Intelligence, Forensic Attribution, and Automated Warning Alerts.

---

## 🌟 Executive Summary

**VaultShield** is a next-generation Cybersecurity Intelligence Platform engineered to detect, analyze, geolocate, and neutralize sophisticated email threats in real time. Powered by **Google Gemini 2.5 Flash**, **IPQualityScore Threat Intelligence**, and a multi-factor **Forensic Risk Engine**, VaultShield connects seamlessly with Gmail via **Google OAuth 2.0** to inspect headers, authenticate sender integrity (SPF/DKIM/DMARC), analyze dangerous URLs, map adversary origins, and automatically dispatch critical security alerts via **SMTP**.

---

## 🏗️ Architecture & Pipeline Flow

```text
                                +-----------------------------+
                                |        User / SOC Team      |
                                +--------------+--------------+
                                               |
                                     Google OAuth 2.0 / JWT
                                               v
                                +-----------------------------+
                                |    VaultShield Frontend     |
                                | (React 19 + TS + Tailwind)  |
                                +--------------+--------------+
                                               |
                                        REST APIs (JSON)
                                               v
+-----------------------------------------------------------------------------------------+
|                               FastAPI Cyber Defense Backend                             |
|                                                                                         |
|  1. Ingestion: Gmail REST API / Manual Paste                                            |
|  2. Header Parsing: From, Reply-To, Return-Path, Authentication-Results                  |
|  3. Origin Verification: SPF, DKIM, DMARC alignment & Source IP extraction              |
|  4. URL Analyzer: Punycode, IP-based URLs, URL shorteners, heuristic path flags         |
|  5. IP Threat Intel: IPQualityScore (Fraud Score, Proxy, VPN, TOR, Botnet feeds)        |
|  6. Geolocation: Approximate IP-based Geolocation & ASN Mapping                        |
|  7. AI Cyber Classifier: Google Gemini 2.5 Flash (Structured Evidence vs Inference)     |
|  8. Composite Risk Engine: Weighted Mathematical Scoring (0 - 100)                      |
|  9. Automated Alerting: High/Critical SMTP Warning Email Dispatch                       |
| 10. Persistence: Supabase PostgreSQL with strict Row Level Security (RLS)               |
+-----------------------------------------------------------------------------------------+
                                               |
                     +-------------------------+-------------------------+
                     v                                                   v
      +-----------------------------+                     +-----------------------------+
      |      Supabase Database      |                     |      Gmail SMTP Service     |
      |  (Emails, Threats, Alerts,  |                     |  (Critical Threat Warnings  |
      |   Analyses, Investigations) |                     |      & Security Briefs)     |
      +-----------------------------+                     +-----------------------------+
```

---

## ✨ Key Features & Capabilities

### 1. 📬 Automated Gmail Ingestion & OAuth 2.0
* Zero-credential mailbox integration using Google OAuth 2.0 authorization.
* Batch range scanning presets (**Last 3, Last 5, Last 10, Last 25, All 50**).
* Automated mailbox synchronization and manual raw header paste inspection.

### 2. 🧠 Google Gemini 2.5 Flash Cyber Threat Classifier
* Deep reasoning model separating **Observed Factual Evidence** from **AI Security Inference**.
* Classifies threats across 8 key cybersecurity categories:
  * Phishing & Credential Harvesting
  * Business Email Compromise (BEC) & Financial Fraud
  * CEO / Executive / Brand Impersonation
  * Malware & Malicious Payload Delivery
  * Social Engineering & Artificial Psychological Urgency
  * Domain & Address Spoofing
  * Account Takeover Attempts
  * Benign / Normal Communication

### 3. 🌐 Threat Intelligence & Origin Forensics
* **IPQualityScore (IPQS)**: Live IP reputation scores, proxy, VPN, TOR node, and botnet tracking.
* **Approximate IP Geolocation**: Interactive geographical mapping, country, city, ISP, and ASN resolution with resilient multi-tier fallback.
* **Email Authentication Diagnostics**: Deep inspection of `Authentication-Results`, `Received`, SPF, DKIM, and DMARC headers.

### 4. ⚖️ Explainable Composite Risk Engine
Computes a mathematically sound composite score between **0 and 100**:
$$\text{Risk Score} = (0.35 \times \text{AI Score}) + (0.25 \times \text{IP Fraud Score}) + (0.20 \times \text{Auth Risk}) + (0.20 \times \text{URL Risk})$$

* **0 – 24 (LOW)**: Benign communication, verified sender.
* **25 – 49 (MEDIUM)**: Low-confidence anomalies or suspicious keywords.
* **50 – 74 (HIGH)**: Elevated risk, sender anomalies, or authentication softfails.
* **75 – 100 (CRITICAL)**: Confirmed attack, credential theft, or domain spoofing.

### 5. 🚨 Automated SMTP Security Warning Emails
* Automatically sends critical security warnings directly to the user's inbox upon detecting high/critical incidents.
* Delivers detailed HTML & Plain Text forensic summaries, observed indicators, and emergency mitigation checklists.

### 6. 🔍 Dual SOC Modes & Deep Forensics
* **User Dashboard**: Personal mailbox protection, real-time threat summary, and incident alerts.
* **Investigator SOC Console**: Enterprise-wide incident queue, interactive geolocation threat map, event timeline, and one-click PDF Forensic Report generation (via ReportLab).

---

## 🛠️ Complete Tech Stack & Tools Used

### Frontend Architecture
| Technology | Description |
| :--- | :--- |
| **React 19** | Modern reactive component architecture |
| **TypeScript** | Strict compile-time type safety |
| **Vite 8** | High-performance build tool and dev server |
| **Tailwind CSS** | Premium cybersecurity SOC aesthetic and design tokens |
| **Lucide React** | Cyber threat, map, and status icons |
| **Framer Motion** | Smooth interactive animations and modal transitions |

### Backend Architecture
| Technology | Description |
| :--- | :--- |
| **Python 3.13** | Core backend programming language |
| **FastAPI** | High-performance asynchronous REST API framework |
| **Uvicorn** | ASGI server with hot-reload support |
| **Pydantic v2** | Data validation, serialization, and JSON schema enforcement |
| **HTTPX** | Asynchronous HTTP client for external API requests |
| **ReportLab** | High-fidelity PDF forensic investigation dossier generation |
| **smtplib & ssl** | TLS/SSL automated security warning alert dispatching |

### Database & Security
| Technology | Description |
| :--- | :--- |
| **Supabase PostgreSQL** | Cloud-native relational database |
| **Row Level Security (RLS)** | Strict tenant isolation and profile-based data ownership |
| **Supabase Auth (JWT)** | Secure token-based session management |

### External APIs & Intelligence Feeds
| Service | Purpose |
| :--- | :--- |
| **Google Gemini API** (`gemini-2.5-flash`) | AI cyber threat classification & inference |
| **Google OAuth 2.0** | Consent and authorization flow |
| **Gmail REST API** | Mailbox message list and MIME message extraction |
| **IPQualityScore API** | Real-time IP fraud and reputation intelligence |
| **ipapi.co / ip-api.com** | IP geolocation and Autonomous System (ASN) lookup |
| **Gmail SMTP** | Real-time automated warning dispatch |

---

## 📂 Project Structure

```text
sih/
├── backend/
│   ├── app/
│   │   ├── api/                    # REST API Routers
│   │   │   ├── analytics.py        # Threat statistics & metrics
│   │   │   ├── auth.py             # Signup, Signin, Google OAuth
│   │   │   ├── emails.py           # Email fetching & manual scanning
│   │   │   ├── geolocation.py      # IP geolocation resolution
│   │   │   ├── gmail.py            # Gmail API connection & inbox scans
│   │   │   ├── investigators.py    # SOC console & deep forensic dossiers
│   │   │   ├── reports.py          # PDF forensic report generation
│   │   │   └── threats.py          # Threat incidents & user alerts
│   │   ├── schemas/                # Pydantic v2 validation models
│   │   ├── services/               # Core intelligence engines
│   │   │   ├── email_parser.py     # Header & MIME parser
│   │   │   ├── gemini_service.py   # Gemini 2.5 Flash AI analysis
│   │   │   ├── geolocation_service.py # Approximate IP geolocation
│   │   │   ├── gmail_service.py    # Automated scan pipeline coordinator
│   │   │   ├── google_oauth_service.py # OAuth token exchange
│   │   │   ├── ipqualityscore_service.py # IPQS threat scoring
│   │   │   ├── report_service.py   # ReportLab PDF generator
│   │   │   ├── smtp_service.py     # Automated SMTP warning alerts
│   │   │   ├── threat_engine.py    # Composite mathematical risk engine
│   │   │   └── url_analyzer.py     # URL heuristic flags & risk analyzer
│   │   ├── config.py               # Environment configuration settings
│   │   ├── database.py             # Supabase & in-memory database clients
│   │   ├── dependencies.py         # JWT auth & RBAC route guards
│   │   └── main.py                 # FastAPI application factory
│   ├── database_schema.sql         # Supabase PostgreSQL DDL & RLS policies
│   ├── requirements.txt            # Python dependencies
│   ├── run.py                      # Backend startup runner
│   ├── .env.example                # Safe backend environment template
│   └── .env                        # Local credentials (git-ignored)
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI & Dashboard components
│   │   │   ├── dashboard/          # User & Investigator consoles
│   │   │   │   ├── ForensicsModal.tsx        # Deep-dive forensic dossier modal
│   │   │   │   ├── InvestigatorDashboard.tsx # SOC management console
│   │   │   │   ├── ManualScanModal.tsx       # Raw email paste scanner
│   │   │   │   ├── ThreatMapView.tsx         # Geolocation threat origin map
│   │   │   │   └── UserDashboard.tsx         # Mailbox protection console
│   │   │   ├── ui/                 # Forms & navigation
│   │   │   │   └── auth-form.tsx   # Login/Signup with "Continue with Google"
│   │   │   └── Navbar.tsx          # App navigation header
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Global JWT authentication context
│   │   ├── services/               # Frontend API client services
│   │   ├── App.tsx                 # Root router & views
│   │   └── main.tsx                # React entry point
│   ├── package.json                # Node dependencies
│   ├── vite.config.ts              # Vite configuration
│   ├── .env.example                # Safe frontend environment template
│   └── .env                        # Local frontend environment variables
│
├── .gitignore                      # Enforced secret & artifact exclusions
└── README.md                       # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Python 3.10+** (Python 3.13 recommended)
* **Node.js 18+** & **npm**
* **Supabase Project** (PostgreSQL)

---

### 2. Backend Setup

```powershell
# Navigate to backend directory
cd c:\sih\backend

# Install Python dependencies
pip install -r requirements.txt

# Create your .env file from the template
copy .env.example .env
```

Configure your credentials in `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-secret-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-secret-key

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/gmail/callback

GEMINI_API_KEY=your-gemini-api-key
GEMINI_FAST_MODEL=gemini-2.5-flash
GEMINI_PRO_MODEL=gemini-2.5-pro

IPQS_API_KEY=your-ipqualityscore-api-key
IP_GEOLOCATION_BASE_URL=https://ipapi.co

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
ALERT_RECIPIENT_EMAIL=your-alert-recipient@gmail.com
```

Initialize the Supabase database schema by running [database_schema.sql](file:///c:/sih/backend/database_schema.sql) in the Supabase SQL Editor.

Start the FastAPI backend:
```powershell
python run.py
```
*Backend runs on `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).*

---

### 3. Frontend Setup

```powershell
# Open a new terminal and navigate to frontend
cd c:\sih\frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📡 Core API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register new user profile |
| `POST` | `/api/auth/signin` | Authenticate user & return JWT token |
| `GET` | `/api/auth/google/url` | Initiate Google OAuth Single Sign-On |
| `GET` | `/api/auth/me` | Retrieve authenticated user identity & role |
| `GET` | `/api/gmail/connect` | Generate Gmail API consent authorization URL |
| `GET` | `/api/gmail/callback` | Google OAuth token exchange handler |
| `POST` | `/api/gmail/scan` | Execute mailbox threat scan on selected range |
| `POST` | `/api/emails/scan/manual` | Run manual raw email inspection |
| `GET` | `/api/threats` | List detected threat incidents for user |
| `GET` | `/api/investigator/dashboard` | Retrieve high-level SOC metrics |
| `GET` | `/api/investigator/forensics/{id}` | Deep-dive forensic dossier & evidence |
| `GET` | `/api/reports/threat/{id}/pdf` | Generate downloadable PDF incident report |

---

## 🛡️ Security & Privacy Compliance

* **No Plaintext Secret Commits**: Real API keys and credentials are strictly excluded via `.gitignore` and kept local.
* **Row Level Security (RLS)**: PostgreSQL tables are protected with policies ensuring regular users only access their personal telemetry.
* **Explainable AI**: The system pairs AI probabilistic reasoning with empirical cryptographic header results (SPF/DKIM/DMARC) and threat intelligence.

---

## 👥 Authors & Acknowledgments

* **Project**: VaultShield Cyber Defense Platform
* **Competition**: Smart India Hackathon (SIH 2026)
* **Lead Developer**: Yamuna & Team
