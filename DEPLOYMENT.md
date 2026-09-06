# CyberTrace — Production Deployment Guide
## Render (Backend) + Vercel (Frontend) + Supabase (Database)

> **Project:** AI-Powered Email Threat Detection, GeoLocation and Forensic Intelligence Platform  
> **Stack:** React/Vite (Vercel) + FastAPI/Gunicorn (Render) + Supabase PostgreSQL

---

## Prerequisites

- GitHub repository pushed and up to date
- Supabase project already configured (existing)
- Google Cloud project with Gmail API enabled
- Gemini API key (Google AI Studio)
- IPQualityScore API key

---

## Step 1 — Push to GitHub

Ensure `.env` files are NOT committed (they are git-ignored).

```bash
git add .
git commit -m "feat: production deployment preparation"
git push origin main
```

Verify `.env` is NOT tracked:
```bash
git ls-files backend/.env frontend/.env
# Should return nothing (empty)
```

---

## Step 2 — Deploy Backend on Render

### 2a. Create a New Web Service on Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repository
3. Select the **root** of the repository (not `/backend`)

### 2b. Configure Build Settings

| Setting | Value |
|---------|-------|
| **Name** | `cybertrace-backend` (or your choice) |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:$PORT --timeout 120 app.main:app` |

> **Important:** The Start Command above is the exact command — do not change `app.main:app` (that is the import path from the `backend/` directory).

### 2c. Set Environment Variables on Render

In the Render dashboard → **Environment** tab, add these variables:

| Variable | Value |
|----------|-------|
| `ENVIRONMENT` | `production` |
| `PORT` | `10000` (Render sets this automatically — you can leave it out) |
| `HOST` | `0.0.0.0` |
| `FRONTEND_URL` | `https://your-app.vercel.app` ← fill after Vercel deploy |
| `CORS_ORIGINS` | `https://your-app.vercel.app` ← fill after Vercel deploy |
| `SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | your publishable key |
| `SUPABASE_SECRET_KEY` | your secret key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key |
| `SUPABASE_JWKS_URL` | `https://your-project-id.supabase.co/auth/v1/.well-known/jwks.json` |
| `GOOGLE_CLIENT_ID` | your Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | your Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | `https://cybertrace-backend.onrender.com/api/gmail/callback` ← use actual Render URL |
| `GEMINI_API_KEY` | your Gemini API key |
| `GEMINI_FAST_MODEL` | `gemini-2.5-flash` |
| `GEMINI_PRO_MODEL` | `gemini-2.5-pro` |
| `IPQS_API_KEY` | your IPQualityScore key |
| `IP_GEOLOCATION_BASE_URL` | `https://ipapi.co` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your Gmail address |
| `SMTP_PASSWORD` | your Gmail App Password |
| `ALERT_RECIPIENT_EMAIL` | your alert email |
| `ADMIN_EMAIL` | your admin email |
| `ADMIN_INVESTIGATOR_EMAILS` | comma-separated investigator emails |
| `AUTO_MONITOR_POLL_INTERVAL_SECONDS` | `60` |
| `WEB_CONCURRENCY` | `2` |

### 2d. Deploy

Click **Create Web Service** → Render will build and deploy.

After deployment, note your backend URL:
```
https://cybertrace-backend.onrender.com
```

### 2e. Verify Backend Health

```bash
curl https://cybertrace-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "production",
  "supabase_connected": true,
  "gemini_configured": true,
  "ipqs_configured": true,
  "google_oauth_configured": true
}
```

---

## Step 3 — Deploy Frontend on Vercel

### 3a. Create a New Project on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Vercel will auto-detect it as a Vite project

### 3b. Configure Build Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 3c. Set Environment Variables on Vercel

In Vercel → Project → **Settings** → **Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://cybertrace-backend.onrender.com/api` |
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon/publishable key |

> **Set for:** Production, Preview, and Development environments.

### 3d. Deploy

Click **Deploy** → Vercel builds and publishes the React app.

After deployment, note your frontend URL:
```
https://cybertrace-app.vercel.app
```

### 3e. Update Render CORS After Vercel Deploy

Go back to Render → Environment → update these two variables with your actual Vercel URL:
```
FRONTEND_URL=https://cybertrace-app.vercel.app
CORS_ORIGINS=https://cybertrace-app.vercel.app
```

Then trigger a **Manual Deploy** on Render to apply the CORS update.

---

## Step 4 — Configure Google Cloud Console

> Do this AFTER you have your Render backend URL.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your project → **APIs & Services** → **Credentials**
3. Click your **OAuth 2.0 Client ID**

### Authorized JavaScript Origins
Add your Vercel frontend URL:
```
https://cybertrace-app.vercel.app
```
Keep `http://localhost:5173` for local development.

### Authorized Redirect URIs
Add your Render callback URL:
```
https://cybertrace-backend.onrender.com/api/gmail/callback
```
Keep `http://localhost:8000/api/gmail/callback` for local development.

> **Exact OAuth callback path:** `/api/gmail/callback`

### OAuth Consent Screen

4. Go to **APIs & Services** → **OAuth consent screen**
5. If status is **Testing** → only test users can sign in
6. To allow any Google user:
   - Click **Publish App** → Submit for verification
   - OR add test users manually for demo/SIH purposes

### Gmail API Scopes Required
| Scope | Purpose |
|-------|---------|
| `https://www.googleapis.com/auth/gmail.readonly` | Read Gmail messages |
| `https://www.googleapis.com/auth/userinfo.email` | Get user email |
| `https://www.googleapis.com/auth/userinfo.profile` | Get user profile |

---

## Step 5 — Supabase Verification

Your Supabase is already cloud-hosted — no migration needed.

Verify in Supabase dashboard:
1. **Authentication** → **URL Configuration** → Add your Vercel URL to **Site URL**:
   ```
   https://cybertrace-app.vercel.app
   ```
2. **Authentication** → **URL Configuration** → **Redirect URLs** → Add:
   ```
   https://cybertrace-app.vercel.app/**
   ```

---

## Step 6 — Production Test Checklist

Run these tests after full deployment:

```
[ ] https://cybertrace-app.vercel.app loads (landing page)
[ ] Sign up with email works
[ ] Sign in with email works
[ ] GET https://cybertrace-backend.onrender.com/api/health returns {"status":"healthy"}
[ ] "Connect Gmail" button triggers Google OAuth flow
[ ] Google OAuth redirects to Render backend callback URL
[ ] Gmail callback completes — returns to frontend dashboard
[ ] Scan Gmail emails — threat analysis runs
[ ] Dashboard shows email stats
[ ] Area chart shows telemetry data
[ ] Threat map loads with geolocation pins
[ ] Investigator dashboard accessible (with investigator email)
[ ] RAG AI Assistant responds in 5-6 lines
[ ] SMTP warning email sent when high-risk email detected
[ ] Background monitoring toggle works
[ ] Email details page opens
[ ] PDF report generation works
[ ] No CORS errors in browser console
[ ] No localhost URLs in network requests
```

---

## Render Build Command Reference

```
pip install -r requirements.txt
```

## Render Start Command Reference

```
gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:$PORT --timeout 120 app.main:app
```

> Note: `$PORT` is automatically injected by Render. Do not hardcode a port number.

## Vercel Build Command Reference

```
npm run build
```

---

## Local Development (after deployment)

To continue developing locally alongside the deployed app:

```bash
# Backend (local)
cd backend
python run.py
# Runs on http://localhost:8000

# Frontend (local, pointing to local backend)
cd frontend
# .env should have: VITE_API_BASE_URL=http://localhost:8000/api
npm run dev
# Runs on http://localhost:5173
```

---

## Troubleshooting

### CORS Error in Browser
- Verify `CORS_ORIGINS` on Render matches your exact Vercel URL (no trailing slash)
- Trigger a new Render deploy after changing env vars
- Check browser Network tab → response headers must include `Access-Control-Allow-Origin`

### Gmail OAuth Callback Fails
- Verify `GOOGLE_REDIRECT_URI` on Render exactly matches what is in Google Cloud Console
- Verify the URI is listed under **Authorized Redirect URIs** in Google Cloud Console
- Google OAuth changes take ~5 minutes to propagate

### Supabase Connection Error
- Check `SUPABASE_URL`, `SUPABASE_SECRET_KEY` on Render
- Verify `/api/health` returns `"supabase_connected": true`
- Check Supabase dashboard for any project pausing (free tier pauses after 1 week of inactivity)

### RAG / Gemini Empty Response
- Verify `GEMINI_API_KEY` is set on Render
- `/api/health` must show `"gemini_configured": true`
- The RAG service now has `thinkingConfig: {thinkingBudget: 0}` to prevent empty outputs

### Backend Slow to Start (Render free tier)
- Render free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30-60 seconds (cold start)
- Upgrade to Render Starter ($7/month) to keep the service always-on

### Token Refresh / Gmail Auth Expiry
- The backend has a full refresh token cycle in `google_oauth_service.py`
- If a user sees "Gmail disconnected", they simply re-connect Gmail (OAuth flow)
- Tokens are persisted in Supabase `gmail_accounts` table

---

## Credentials That Must Be Rotated Before Production

> The following credentials were present in the local `.env` file and must be regenerated before deploying:
> 
> 1. `GOOGLE_CLIENT_SECRET` — regenerate in Google Cloud Console → Credentials
> 2. `GEMINI_API_KEY` — regenerate in Google AI Studio
> 3. `IPQS_API_KEY` — regenerate in IPQualityScore dashboard
> 4. `SMTP_PASSWORD` (Gmail App Password) — revoke and regenerate at myaccount.google.com/apppasswords
> 5. `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — rotate in Supabase Settings → API
>
> After rotating, set the new values ONLY in Render's Environment tab. Never commit them to Git.