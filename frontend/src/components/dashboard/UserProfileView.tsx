import React, { useState } from 'react'
import {
  User, Mail, KeyRound, ShieldCheck, RefreshCw,
  Camera, CheckCircle2, AlertTriangle,
  Lock, ExternalLink, Unlink, Eye, EyeOff
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/auth'
import { gmailService, type GmailStatus, type MonitoringStatus } from '../../services/gmail'

interface UserProfileViewProps {
  gmailStatus: GmailStatus | null
  monitoringStatus: MonitoringStatus | null
  onRefreshGmailStatus: () => void
}

const PRESET_AVATARS = [
  { id: '1', name: 'Cyber Guardian', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: '2', name: 'Security Analyst', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: '3', name: 'Threat Hunter', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { id: '4', name: 'Forensic Officer', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: '5', name: 'SOC Defender', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { id: '6', name: 'Cyber Sentinel', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
]

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  gmailStatus,
  monitoringStatus,
  onRefreshGmailStatus,
}) => {
  const { user, refreshUser } = useAuth()
  
  // Profile State
  const [name, setName] = useState(user?.name || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [customAvatarInput, setCustomAvatarInput] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [changingPass, setChangingPass] = useState(false)
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Gmail Connection State
  const [connectingGmail, setConnectingGmail] = useState(false)
  const [disconnectingGmail, setDisconnectingGmail] = useState(false)
  const [togglingMonitor, setTogglingMonitor] = useState(false)
  const [gmailMsg, setGmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isGmailConnected = gmailStatus?.is_connected ?? false
  const isAutoMonitoring = monitoringStatus?.monitoring_active ?? gmailStatus?.monitoring_active ?? false

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const updated = await authService.updateProfile({
        name: name.trim(),
        avatar_url: avatarUrl.trim() || undefined,
      })
      // Update local storage user
      const stored = localStorage.getItem('vaultshield_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        localStorage.setItem('vaultshield_user', JSON.stringify({ ...parsed, name: updated.name, avatar_url: updated.avatar_url }))
      }
      await refreshUser()
      setProfileMsg({ type: 'success', text: 'Profile details updated successfully!' })
      setTimeout(() => setProfileMsg(null), 4000)
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err?.message || 'Failed to update profile.' })
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle Image File Upload (as Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Image file must be under 2MB.' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'New password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    setChangingPass(true)
    setPassMsg(null)
    try {
      const res = await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      setPassMsg({ type: 'success', text: res.message || 'Password changed successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPassMsg(null), 4000)
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err?.message || 'Failed to change password.' })
    } finally {
      setChangingPass(false)
    }
  }

  // Handle Connect Gmail
  const handleConnectGmail = async () => {
    setConnectingGmail(true)
    setGmailMsg(null)
    try {
      const res = await gmailService.connect()
      if (res.auth_url) {
        window.location.href = res.auth_url
      }
    } catch (err: any) {
      setGmailMsg({ type: 'error', text: 'Failed to initiate Google OAuth 2.0 authorization.' })
    } finally {
      setConnectingGmail(false)
    }
  }

  // Handle Disconnect Gmail
  const handleDisconnectGmail = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Gmail integration?')) return
    setDisconnectingGmail(true)
    setGmailMsg(null)
    try {
      await gmailService.disconnect()
      onRefreshGmailStatus()
      setGmailMsg({ type: 'success', text: 'Gmail disconnected successfully.' })
      setTimeout(() => setGmailMsg(null), 4000)
    } catch (err: any) {
      setGmailMsg({ type: 'error', text: 'Failed to disconnect Gmail.' })
    } finally {
      setDisconnectingGmail(false)
    }
  }

  // Handle Toggle Auto-Monitoring
  const handleToggleMonitoring = async () => {
    setTogglingMonitor(true)
    setGmailMsg(null)
    const nextState = !isAutoMonitoring
    try {
      if (nextState) {
        await gmailService.startMonitoring()
      } else {
        await gmailService.stopMonitoring()
      }
      onRefreshGmailStatus()
      setGmailMsg({
        type: 'success',
        text: `Automated Gmail monitoring is now ${nextState ? 'ENABLED' : 'DISABLED'}.`,
      })
      setTimeout(() => setGmailMsg(null), 4000)
    } catch (err: any) {
      setGmailMsg({ type: 'error', text: 'Failed to toggle Gmail monitoring.' })
    } finally {
      setTogglingMonitor(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in font-body">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#192837]/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name || 'Avatar'}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-[#7342E2]/20 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7342E2] text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-[#7342E2]/25">
                {name ? name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U'}
              </div>
            )}
            <label
              htmlFor="avatar-upload-header"
              className="absolute -bottom-1 -right-1 p-1.5 bg-[#7342E2] hover:bg-[#6332d2] text-white rounded-xl shadow-md cursor-pointer transition-all"
              title="Change Avatar"
            >
              <Camera size={14} />
              <input
                id="avatar-upload-header"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#192837]">
                {user?.name || 'Account Settings'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#7342E2]/10 text-[#7342E2]">
                {user?.role || 'User'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#192837]/60 mt-0.5">
              {user?.email} &bull; Security & Profile Management
            </p>
          </div>
        </div>

        {/* Global Status Pill in Profile Header */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold ${
            isGmailConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isGmailConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span>{isGmailConnected ? `Gmail Connected: ${gmailStatus?.email_address || user?.email}` : 'Gmail Disconnected'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECTION 1: PROFILE DETAILS & AVATAR SELECTION */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#192837]/10 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#192837]/10">
            <div className="w-10 h-10 rounded-2xl bg-[#7342E2]/10 text-[#7342E2] flex items-center justify-center font-bold">
              <User size={20} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#192837]">Profile Information</h2>
              <p className="text-xs text-[#192837]/60">Customize your display name and security avatar</p>
            </div>
          </div>

          {profileMsg && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
              profileMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {profileMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-[#192837] mb-1.5 uppercase tracking-wider">
                Full Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-2.5 rounded-xl border border-[#192837]/15 bg-[#FAF9F6] text-xs sm:text-sm font-semibold text-[#192837] focus:outline-none focus:ring-2 focus:ring-[#7342E2] focus:bg-white transition-all"
                required
              />
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="block text-xs font-bold text-[#192837] mb-1.5 uppercase tracking-wider">
                Registered Email (ID)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-[#192837]/10 bg-black/5 text-xs sm:text-sm font-semibold text-[#192837]/60 cursor-not-allowed"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#192837]/40 bg-white/80 px-2 py-0.5 rounded-md border border-[#192837]/10">
                  Fixed
                </span>
              </div>
            </div>

            {/* Avatar Selector Presets */}
            <div>
              <label className="block text-xs font-bold text-[#192837] mb-2 uppercase tracking-wider">
                Choose Profile Avatar
              </label>
              <div className="grid grid-cols-6 gap-2 sm:gap-3">
                {PRESET_AVATARS.map((p) => {
                  const isSelected = avatarUrl === p.url
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setAvatarUrl(p.url)}
                      title={p.name}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all p-0.5 cursor-pointer ${
                        isSelected
                          ? 'border-[#7342E2] ring-2 ring-[#7342E2]/30 scale-105 shadow-md'
                          : 'border-transparent hover:border-[#7342E2]/40 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Avatar URL or File Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#192837] uppercase tracking-wider">
                Or Upload Image / Custom URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={customAvatarInput}
                  onChange={(e) => setCustomAvatarInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-[#192837]/15 bg-[#FAF9F6] text-xs font-medium text-[#192837] focus:outline-none focus:ring-2 focus:ring-[#7342E2]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAvatarInput.trim()) {
                      setAvatarUrl(customAvatarInput.trim())
                      setCustomAvatarInput('')
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-[#7342E2]/10 hover:bg-[#7342E2]/20 text-[#7342E2] text-xs font-bold cursor-pointer"
                >
                  Apply
                </button>
                <label className="px-3 py-2 rounded-xl bg-[#FAF9F6] hover:bg-black/5 border border-[#192837]/15 text-[#192837] text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0">
                  <Camera size={14} />
                  <span>Upload File</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7342E2] hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#7342E2]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingProfile ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* SECTION 2: PASSWORD CHANGE FORM */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#192837]/10 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#192837]/10">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#192837]">Change Password</h2>
              <p className="text-xs text-[#192837]/60">Update your account authentication credentials</p>
            </div>
          </div>

          {passMsg && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
              passMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {passMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{passMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#192837] mb-1.5 uppercase tracking-wider">
                Current Password (Optional if OAuth)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#192837]/15 bg-[#FAF9F6] text-xs sm:text-sm font-semibold text-[#192837] focus:outline-none focus:ring-2 focus:ring-[#7342E2] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#192837]/40 hover:text-[#192837] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#192837] mb-1.5 uppercase tracking-wider">
                New Password (Min. 6 Characters)
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong new password"
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-[#192837]/15 bg-[#FAF9F6] text-xs sm:text-sm font-semibold text-[#192837] focus:outline-none focus:ring-2 focus:ring-[#7342E2] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#192837] mb-1.5 uppercase tracking-wider">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-[#192837]/15 bg-[#FAF9F6] text-xs sm:text-sm font-semibold text-[#192837] focus:outline-none focus:ring-2 focus:ring-[#7342E2] focus:bg-white transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={changingPass}
                className="w-full py-2.5 rounded-xl bg-[#192837] hover:bg-black text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {changingPass ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}
                <span>{changingPass ? 'Updating Credentials...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SECTION 3: CENTRALIZED GMAIL CONNECTION & OAUTH MANAGEMENT */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#192837]/10 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#192837]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#192837]">Gmail Ingestion & OAuth Integration</h2>
              <p className="text-xs text-[#192837]/60">
                Authorize Google Workspace API to enable automated live threat inspection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border ${
              isGmailConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isGmailConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {isGmailConnected ? 'Connected & Authorized' : 'Not Connected'}
            </span>
          </div>
        </div>

        {gmailMsg && (
          <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
            gmailMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {gmailMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{gmailMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Connection Actions */}
          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#192837]/10 space-y-4">
            <h3 className="font-heading text-sm font-bold text-[#192837]">Connection Status</h3>
            <p className="text-xs text-[#192837]/70 leading-relaxed">
              {isGmailConnected
                ? `Authorized account: ${gmailStatus?.email_address || user?.email}. Token refresh active.`
                : 'Connect your Gmail account via Google OAuth 2.0 to scan inbox emails directly with Gemini AI security model.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {isGmailConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnectGmail}
                  disabled={disconnectingGmail}
                  className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {disconnectingGmail ? <RefreshCw size={14} className="animate-spin" /> : <Unlink size={14} />}
                  <span>{disconnectingGmail ? 'Disconnecting...' : 'Disconnect Gmail Account'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGmail}
                  disabled={connectingGmail}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7342E2] hover:brightness-110 text-white text-xs font-bold transition-all shadow-md shadow-[#7342E2]/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {connectingGmail ? <RefreshCw size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                  <span>{connectingGmail ? 'Redirecting to Google...' : 'Connect Gmail Account'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Automated Monitoring Controls */}
          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#192837]/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-sm font-bold text-[#192837]">Automated Background Monitoring</h3>
                <p className="text-xs text-[#192837]/70 mt-0.5">Poll inbox every 30s & quarantine zero-day threats</p>
              </div>
              <button
                type="button"
                disabled={!isGmailConnected || togglingMonitor}
                onClick={handleToggleMonitoring}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 ${
                  isAutoMonitoring ? 'bg-[#7342E2]' : 'bg-[#192837]/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAutoMonitoring ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-3 bg-white rounded-xl border border-[#192837]/10">
                <span className="text-[10px] text-[#192837]/60 block uppercase font-bold">Auto-Processed</span>
                <span className="font-extrabold text-sm text-[#192837] mt-0.5 block">
                  {monitoringStatus?.emails_auto_processed ?? gmailStatus?.emails_auto_processed ?? 0} emails
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#192837]/10">
                <span className="text-[10px] text-[#192837]/60 block uppercase font-bold">Warnings Dispatched</span>
                <span className="font-extrabold text-sm text-orange-600 mt-0.5 block">
                  {monitoringStatus?.threats_detected ?? gmailStatus?.warnings_sent ?? 0} threats
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
