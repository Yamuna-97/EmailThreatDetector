"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  ChevronLeft,
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  KeyRound,
  RotateCw,
  Edit3
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ShapeGrid from "../ShapeGrid"
import { useAuth } from "../../context/AuthContext"
import { authService } from "../../services/auth"

export type AuthFormMode = "signin" | "signup" | "signup_otp" | "forgot_password" | "forgot_password_otp"

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
  const { login, verifySignupOtp, refreshUser } = useAuth()
  const [mode, setMode] = useState<AuthFormMode>(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [resendCooldown])

  // Clear OTP fields when mode changes
  const resetOtpFields = () => {
    setOtp(["", "", "", "", "", ""])
  }

  // Handle OTP digit inputs
  const handleOtpChange = (index: number, val: string) => {
    const sanitized = val.replace(/\D/g, "")
    if (!sanitized) {
      const updated = [...otp]
      updated[index] = ""
      setOtp(updated)
      return
    }

    // Handle pasted multiple digits
    if (sanitized.length > 1) {
      const digits = sanitized.slice(0, 6).split("")
      const updated = [...otp]
      digits.forEach((d, idx) => {
        if (index + idx < 6) updated[index + idx] = d
      })
      setOtp(updated)
      const nextIndex = Math.min(index + digits.length, 5)
      otpInputsRef.current[nextIndex]?.focus()
      return
    }

    const updated = [...otp]
    updated[index] = sanitized[0]
    setOtp(updated)

    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  // 1. Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const user = await login(email, password)
      setSuccessMsg(`Welcome back, ${user.name}! Accessing console...`)
      setTimeout(() => {
        if (onSuccess) onSuccess(user)
      }, 600)
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.")
    } finally {
      setLoading(false)
    }
  }

  // 2. Handle Step 1 of Sign Up (Send OTP)
  const handleRequestSignUpOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const res = await authService.sendSignupOtp({
        email,
        password,
        full_name: fullName,
      })
      resetOtpFields()
      setResendCooldown(45)
      setSuccessMsg(res.message || `Verification code sent to ${email}`)
      setMode("signup_otp")
      setTimeout(() => {
        otpInputsRef.current[0]?.focus()
      }, 300)
    } catch (err: any) {
      setError(err.message || "Failed to send verification code. Please check email address.")
    } finally {
      setLoading(false)
    }
  }

  // 3. Handle Step 2 of Sign Up (Verify OTP & Login)
  const handleVerifySignUpOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join("").trim()
    if (otpCode.length < 6) {
      setError("Please enter the complete 6-digit verification code.")
      return
    }

    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const user = await verifySignupOtp(email, otpCode)
      setSuccessMsg("Email verified & account activated! Entering defense console...")
      setTimeout(() => {
        if (onSuccess) onSuccess(user)
      }, 600)
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // 4. Handle Step 1 of Forgot Password (Send Reset Code)
  const handleRequestForgotPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Please enter your registered work email address.")
      return
    }

    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const res = await authService.sendForgotPasswordOtp({ email })
      resetOtpFields()
      setResendCooldown(45)
      setSuccessMsg(res.message || `Password reset code sent to ${email}`)
      setMode("forgot_password_otp")
      setTimeout(() => {
        otpInputsRef.current[0]?.focus()
      }, 300)
    } catch (err: any) {
      setError(err.message || "Failed to send reset code. Please check email address.")
    } finally {
      setLoading(false)
    }
  }

  // 5. Handle Step 2 of Forgot Password (Reset Password)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join("").trim()
    if (otpCode.length < 6) {
      setError("Please enter the complete 6-digit verification code.")
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.")
      return
    }

    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const res = await authService.resetPasswordWithOtp({
        email,
        otp: otpCode,
        new_password: newPassword,
      })
      setSuccessMsg(res.message || "Password successfully reset! You can now sign in.")
      setPassword(newPassword)
      setTimeout(() => {
        setMode("signin")
        setError(null)
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Check verification code.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Resend OTP
  const handleResendOtp = async (purpose: "signup" | "forgot_password") => {
    if (resendCooldown > 0) return
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const res = await authService.resendOtp({ email, purpose })
      setResendCooldown(45)
      resetOtpFields()
      setSuccessMsg(res.message || "A new 6-digit code has been dispatched to your email.")
      otpInputsRef.current[0]?.focus()
    } catch (err: any) {
      setError(err.message || "Failed to resend code. Please try again.")
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
    <div className="relative min-h-screen w-full bg-[#FAF9F6] text-[#192837] selection:bg-[#7342E2]/15 selection:text-[#7342E2] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
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

        {/* Dynamic Headers */}
        {mode === "signin" && (
          <Header
            title="Sign in to Defense Console"
            subtitle="Don't have an account?"
            actionText="Create one."
            onAction={() => {
              setMode("signup")
              setError(null)
              setSuccessMsg(null)
            }}
          />
        )}

        {mode === "signup" && (
          <Header
            title="Create Defense Account"
            subtitle="Already registered?"
            actionText="Sign in."
            onAction={() => {
              setMode("signin")
              setError(null)
              setSuccessMsg(null)
            }}
          />
        )}

        {mode === "signup_otp" && (
          <div className="mb-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-[#7342E2]/10 text-[#7342E2] flex items-center justify-center mb-3">
              <KeyRound size={24} />
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#192837] tracking-tight">
              Verify Your Email
            </h1>
            <p className="mt-1.5 text-xs text-[#192837]/65 flex items-center justify-center gap-1.5 flex-wrap">
              <span>Code sent to</span>
              <strong className="text-[#192837] font-semibold">{email}</strong>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-[#7342E2] hover:underline font-bold inline-flex items-center gap-0.5 ml-1 cursor-pointer"
              >
                <Edit3 size={11} />
                <span>Edit</span>
              </button>
            </p>
          </div>
        )}

        {mode === "forgot_password" && (
          <div className="mb-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
              <RotateCw size={24} />
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#192837] tracking-tight">
              Reset Password
            </h1>
            <p className="mt-1.5 text-xs text-[#192837]/65">
              Enter your work email address to receive a 6-digit security reset code.
            </p>
          </div>
        )}

        {mode === "forgot_password_otp" && (
          <div className="mb-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-[#7342E2]/10 text-[#7342E2] flex items-center justify-center mb-3">
              <Lock size={24} />
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#192837] tracking-tight">
              Choose New Password
            </h1>
            <p className="mt-1.5 text-xs text-[#192837]/65">
              Enter the 6-digit code sent to <strong className="text-[#192837]">{email}</strong> and set your new password.
            </p>
          </div>
        )}

        {/* Quick Fill Test Accounts (Only in Signin Mode) */}
        {mode === "signin" && (
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
        )}

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

        {/* Google OAuth (in Signin / Signup screens) */}
        {(mode === "signin" || mode === "signup") && (
          <>
            <button
              type="button"
              onClick={async () => {
                setError(null)
                try {
                  const res = await authService.getGoogleAuthUrl()
                  if (res.auth_url) {
                    if (res.auth_url.includes("token=")) {
                      const urlObj = new URL(res.auth_url)
                      const params = urlObj.searchParams
                      const activeToken = params.get("token") || `jwt_google_session_${Date.now()}`
                      const activeEmail = params.get("email") || "yamunak972006@gmail.com"
                      const isInvestigator =
                        activeEmail.includes("investigator") ||
                        activeEmail.includes("admin") ||
                        activeEmail === "icecream090706@gmail.com"
                      const activeRole =
                        (params.get("role") as "user" | "investigator" | "admin") ||
                        (isInvestigator ? "investigator" : "user")
                      const activeName = params.get("name") || activeEmail.split("@")[0].toUpperCase()

                      const userObj = {
                        id: params.get("user_id") || `google_usr_${Date.now()}`,
                        email: activeEmail,
                        name: activeName,
                        role: activeRole,
                      }
                      localStorage.setItem("vaultshield_token", activeToken)
                      localStorage.setItem("vaultshield_user", JSON.stringify(userObj))
                      await refreshUser()
                      if (onSuccess) onSuccess(userObj)
                    } else {
                      window.location.href = res.auth_url
                    }
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

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#192837]/10 w-full" />
              <span className="bg-white px-3 text-[10px] font-bold text-[#192837]/40 uppercase tracking-wider">
                OR
              </span>
              <div className="border-t border-[#192837]/10 w-full" />
            </div>
          </>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 1: SIGN IN */}
        {/* ------------------------------------------------------------- */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4 text-left">
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
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot_password")
                    setError(null)
                    setSuccessMsg(null)
                  }}
                  className="text-xs font-bold text-[#7342E2] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
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
                    <span>Sign in to Console</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 2: SIGN UP (Step 1 - Information & Send Code) */}
        {/* ------------------------------------------------------------- */}
        {mode === "signup" && (
          <form onSubmit={handleRequestSignUpOtp} className="space-y-4 text-left">
            <div>
              <label htmlFor="signup-name" className="mb-1.5 block text-xs font-bold text-[#192837]/75 uppercase tracking-wide">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full rounded-2xl border border-[#192837]/15 bg-[#FAF9F6] px-4 py-3 text-sm text-[#192837]
                  placeholder-[#192837]/35 ring-2 ring-transparent transition-all focus:bg-white focus:outline-0 focus:ring-[#7342E2]/50 focus:border-[#7342E2]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="mb-1.5 block text-xs font-bold text-[#192837]/75 uppercase tracking-wide">
                Work Email
              </label>
              <div className="relative">
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.morgan@enterprise.com"
                  className="w-full rounded-2xl border border-[#192837]/15 bg-[#FAF9F6] px-4 py-3 pl-10 text-sm text-[#192837]
                  placeholder-[#192837]/35 ring-2 ring-transparent transition-all focus:bg-white focus:outline-0 focus:ring-[#7342E2]/50 focus:border-[#7342E2]"
                />
                <Mail size={16} className="absolute left-3.5 top-3.5 text-[#192837]/40" />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="mb-1.5 block text-xs font-bold text-[#192837]/75 uppercase tracking-wide">
                Create Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
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
                    <span>Send Verification Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 3: SIGN UP OTP (Step 2 - Verification) */}
        {/* ------------------------------------------------------------- */}
        {mode === "signup_otp" && (
          <form onSubmit={handleVerifySignUpOtp} className="space-y-5 text-left">
            <div>
              <label className="mb-2 block text-xs font-bold text-[#192837]/75 uppercase tracking-wide text-center">
                Enter 6-Digit Verification Code
              </label>
              <div className="flex items-center justify-between gap-2 max-w-[320px] mx-auto">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputsRef.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-extrabold text-[#7342E2] rounded-2xl border border-[#192837]/20 bg-[#FAF9F6] focus:bg-white focus:border-[#7342E2] focus:ring-2 focus:ring-[#7342E2]/40 outline-none transition-all shadow-sm"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-2">
              <span className="text-[#192837]/60">Didn't get the code?</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={() => handleResendOtp("signup")}
                className="font-bold text-[#7342E2] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="w-full rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7342E2] px-5 py-3.5 text-sm font-bold text-white 
                shadow-lg shadow-[#7342E2]/25 ring-2 ring-[#7342E2]/30 ring-offset-2 ring-offset-white
                transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify & Access Console</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-xs font-semibold text-[#192837]/60 hover:text-[#192837] cursor-pointer"
              >
                &larr; Back to account details
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 4: FORGOT PASSWORD (Step 1 - Request Code) */}
        {/* ------------------------------------------------------------- */}
        {mode === "forgot_password" && (
          <form onSubmit={handleRequestForgotPasswordOtp} className="space-y-4 text-left">
            <div>
              <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-bold text-[#192837]/75 uppercase tracking-wide">
                Work Email Address
              </label>
              <div className="relative">
                <input
                  id="forgot-email"
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7342E2] px-5 py-3.5 text-sm font-bold text-white 
                shadow-lg shadow-[#7342E2]/25 ring-2 ring-[#7342E2]/30 ring-offset-2 ring-offset-white
                transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode("signin")
                  setError(null)
                  setSuccessMsg(null)
                }}
                className="text-xs font-semibold text-[#192837]/60 hover:text-[#192837] cursor-pointer"
              >
                &larr; Remember your password? Sign in
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 5: FORGOT PASSWORD OTP (Step 2 - New Password) */}
        {/* ------------------------------------------------------------- */}
        {mode === "forgot_password_otp" && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-left">
            <div>
              <label className="mb-2 block text-xs font-bold text-[#192837]/75 uppercase tracking-wide text-center">
                6-Digit Reset Code
              </label>
              <div className="flex items-center justify-between gap-2 max-w-[320px] mx-auto">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputsRef.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-extrabold text-[#7342E2] rounded-2xl border border-[#192837]/20 bg-[#FAF9F6] focus:bg-white focus:border-[#7342E2] focus:ring-2 focus:ring-[#7342E2]/40 outline-none transition-all shadow-sm"
                  />
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-xs font-bold text-[#192837]/75 uppercase tracking-wide">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-2xl border border-[#192837]/15 bg-[#FAF9F6] px-4 py-3 pl-10 pr-10 text-sm text-[#192837]
                  placeholder-[#192837]/35 ring-2 ring-transparent transition-all focus:bg-white focus:outline-0 focus:ring-[#7342E2]/50 focus:border-[#7342E2]"
                />
                <Lock size={16} className="absolute left-3.5 top-3.5 text-[#192837]/40" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-3.5 text-[#192837]/40 hover:text-[#192837] cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-2">
              <span className="text-[#192837]/60">Didn't receive code?</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={() => handleResendOtp("forgot_password")}
                className="font-bold text-[#7342E2] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || otp.join("").length < 6 || !newPassword}
                className="w-full rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7342E2] px-5 py-3.5 text-sm font-bold text-white 
                shadow-lg shadow-[#7342E2]/25 ring-2 ring-[#7342E2]/30 ring-offset-2 ring-offset-white
                transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Reset Password & Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-xs font-semibold text-[#192837]/60 hover:text-[#192837] cursor-pointer"
              >
                &larr; Back to sign in
              </button>
            </div>
          </form>
        )}

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

const Header: React.FC<{
  title: string
  subtitle: string
  actionText: string
  onAction: () => void
}> = ({ title, subtitle, actionText, onAction }) => (
  <div className="mb-4 text-center">
    <h1 className="font-heading text-2xl font-extrabold text-[#192837] tracking-tight">
      {title}
    </h1>
    <p className="mt-2 text-xs sm:text-sm text-[#192837]/65 font-body">
      {subtitle}{" "}
      <button
        type="button"
        onClick={onAction}
        className="font-bold text-[#7342E2] hover:underline cursor-pointer"
      >
        {actionText}
      </button>
    </p>
  </div>
)

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
