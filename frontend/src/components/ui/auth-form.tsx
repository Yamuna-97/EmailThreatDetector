"use client"

import React, { useState } from "react"
import { ChevronLeft, Shield, Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, UserCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ShapeGrid from "../ShapeGrid"
import { useAuth } from "../../context/AuthContext"
import { authService } from "../../services/auth"

export interface AuthFormProps {
  onBack?: () => void
  initialMode?: "signin" | "signup"
  onSuccess?: (user: { email: string; name?: string; role?: string }) => void
}

export const AuthForm: React.FC<AuthFormProps> = ({
  onBack,
  initialMode = "signin",
  onSuccess,
}) => {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<"signin" | "signup">(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      if (mode === "signup") {
        const user = await signup(email, password, fullName)
        setSuccessMsg("Defense account created successfully! Redirecting...")
        setTimeout(() => {
          if (onSuccess) onSuccess(user)
        }, 600)
      } else {
        const user = await login(email, password)
        setSuccessMsg(`Welcome back, ${user.name}! Accessing console...`)
        setTimeout(() => {
          if (onSuccess) onSuccess(user)
        }, 600)
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.")
    } finally {
      setLoading(false)
    }
  }

  // Quick fill demo credentials for jury presentation
  const handleQuickFill = (demoRole: "analyst" | "investigator") => {
    setError(null)
    if (demoRole === "investigator") {
      setEmail("investigator@vaultshield.ai")
      setPassword("InvestigatorPass123!")
      setFullName("Lead Forensic Investigator")
    } else {
      setEmail("analyst@enterprise.com")
      setPassword("SecPassword123!")
      setFullName("Security Analyst")
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#FAF9F6] text-[#192837] selection:bg-[#7342E2]/15 selection:text-[#7342E2] flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Dynamic Interactive ShapeGrid Background */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-auto">
        <ShapeGrid
          direction="diagonal"
          speed={0.45}
          borderColor="rgba(115, 66, 226, 0.12)"
          squareSize={44}
          hoverFillColor="rgba(115, 66, 226, 0.22)"
          shape="hexagon"
          hoverTrailAmount={6}
          className="w-full h-full"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-[#FAF9F6]/40 to-[#FAF9F6]/90 pointer-events-none" />
      </div>

      <BackButton onBack={onBack} />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-2xl p-8 sm:p-10 border border-[#192837]/10 shadow-2xl shadow-[#7342E2]/10"
      >
        <Logo />
        
        <Header mode={mode} onToggle={() => {
          setMode(mode === "signin" ? "signup" : "signin")
          setError(null)
        }} />

        {/* Quick Fill Test Accounts for Evaluation */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill("analyst")}
            className="text-[11px] font-semibold text-[#7342E2] bg-[#7342E2]/8 hover:bg-[#7342E2]/15 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer"
          >
            <UserCheck size={12} />
            <span>Fill Analyst Demo</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("investigator")}
            className="text-[11px] font-semibold text-[#059669] bg-[#059669]/8 hover:bg-[#059669]/15 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer"
          >
            <Shield size={12} />
            <span>Fill Investigator Demo</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2"
            >
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2"
            >
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google OAuth Single Sign-On / Registration */}
        <button
          type="button"
          onClick={async () => {
            setError(null)
            try {
              const res = await authService.getGoogleAuthUrl()
              if (res.auth_url) {
                window.location.href = res.auth_url
              }
            } catch (err: any) {
              setError(err.message || "Failed to initialize Google verification.")
            }
          }}
          className="w-full mb-4 py-3 px-4 rounded-2xl bg-white border border-[#192837]/15 hover:border-[#7342E2]/40 hover:bg-[#FAF9F6] text-xs sm:text-sm font-bold text-[#192837] flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[#192837]/10 w-full" />
          <span className="bg-white px-3 text-[10px] font-bold text-[#192837]/40 uppercase tracking-wider">
            OR
          </span>
          <div className="border-t border-[#192837]/10 w-full" />
        </div>

        <LoginForm
          mode={mode}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          fullName={fullName}
          setFullName={setFullName}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          loading={loading}
          onSubmit={handleSubmit}
        />

        <TermsAndConditions />
      </motion.div>
    </div>
  )
}

const BackButton: React.FC<{ onBack?: () => void }> = ({ onBack }) => (
  <div className="absolute top-6 left-6 z-20">
    <button
      type="button"
      onClick={onBack || (() => window.history.back())}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-[#192837] bg-white/95 backdrop-blur-md border border-[#192837]/10 hover:bg-[#FAF9F6] hover:border-[#7342E2]/30 active:scale-95 transition-all shadow-sm cursor-pointer"
    >
      <ChevronLeft size={16} className="text-[#7342E2]" />
      <span>Go back</span>
    </button>
  </div>
)

const Logo: React.FC = () => (
  <div className="mb-6 flex items-center justify-center gap-2.5">
    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7342E2] flex items-center justify-center text-white shadow-md shadow-[#7342E2]/20">
      <Shield size={22} className="stroke-[2.5]" />
    </div>
    <span className="font-heading text-2xl font-extrabold tracking-tight text-[#192837]">
      Vault<span className="text-[#7342E2]">Shield</span>
    </span>
  </div>
)

const Header: React.FC<{ mode: "signin" | "signup"; onToggle: () => void }> = ({ mode, onToggle }) => (
  <div className="mb-4 text-center">
    <h1 className="font-heading text-2xl font-extrabold text-[#192837] tracking-tight">
      {mode === "signin" ? "Sign in to Defense Console" : "Create Defense Account"}
    </h1>
    <p className="mt-2 text-xs sm:text-sm text-[#192837]/65 font-body">
      {mode === "signin" ? "Don't have an account?" : "Already registered?"}{" "}
      <button
        type="button"
        onClick={onToggle}
        className="font-bold text-[#7342E2] hover:underline cursor-pointer"
      >
        {mode === "signin" ? "Create one." : "Sign in."}
      </button>
    </p>
  </div>
)

interface LoginFormProps {
  mode: "signin" | "signup"
  email: string
  setEmail: (val: string) => void
  password: string
  setPassword: (val: string) => void
  fullName: string
  setFullName: (val: string) => void
  showPassword: boolean
  setShowPassword: (val: boolean) => void
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
}

const LoginForm: React.FC<LoginFormProps> = ({
  mode,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  showPassword,
  setShowPassword,
  loading,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4 text-left">
      <AnimatePresence mode="wait">
        {mode === "signup" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label htmlFor="name-input" className="mb-1.5 block text-xs font-bold text-[#192837]/75 uppercase tracking-wide">
              Full Name
            </label>
            <div className="relative">
              <input
                id="name-input"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full rounded-2xl border border-[#192837]/15 bg-[#FAF9F6] px-4 py-3 text-sm text-[#192837]
                placeholder-[#192837]/35 ring-2 ring-transparent transition-all focus:bg-white focus:outline-0 focus:ring-[#7342E2]/50 focus:border-[#7342E2]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <label htmlFor="email-input" className="mb-1.5 block text-xs font-bold text-[#192837]/75 uppercase tracking-wide">
          Work Email
        </label>
        <div className="relative">
          <input
            id="email-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="analyst@enterprise.com"
            className="w-full rounded-2xl border border-[#192837]/15 bg-[#FAF9F6] px-4 py-3 pl-10 text-sm text-[#192837]
            placeholder-[#192837]/35 ring-2 ring-transparent transition-all focus:bg-white focus:outline-0 focus:ring-[#7342E2]/50 focus:border-[#7342E2]"
          />
          <Mail size={16} className="absolute left-3.5 top-3.5 text-[#192837]/40" />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password-input" className="block text-xs font-bold text-[#192837]/75 uppercase tracking-wide">
            Password
          </label>
        </div>
        <div className="relative">
          <input
            id="password-input"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full rounded-2xl border border-[#192837]/15 bg-[#FAF9F6] px-4 py-3 pl-10 pr-10 text-sm text-[#192837]
            placeholder-[#192837]/35 ring-2 ring-transparent transition-all focus:bg-white focus:outline-0 focus:ring-[#7342E2]/50 focus:border-[#7342E2]"
          />
          <Lock size={16} className="absolute left-3.5 top-3.5 text-[#192837]/40" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-3.5 text-[#192837]/40 hover:text-[#192837] cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7342E2] px-5 py-3.5 text-sm font-bold text-white 
          shadow-lg shadow-[#7342E2]/25 ring-2 ring-[#7342E2]/30 ring-offset-2 ring-offset-white
          transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{mode === "signin" ? "Sign in to Console" : "Create Defense Account"}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </form>
  )
}

const TermsAndConditions: React.FC = () => (
  <p className="mt-6 text-center text-[11px] text-[#192837]/60 leading-relaxed">
    By signing in, you agree to VaultShield's{" "}
    <a href="#" className="font-semibold text-[#7342E2] hover:underline">
      Terms of Service
    </a>{" "}
    and{" "}
    <a href="#" className="font-semibold text-[#7342E2] hover:underline">
      Privacy Policy
    </a>
    . SOC2 & ISO 27001 Compliant.
  </p>
)

export default AuthForm
