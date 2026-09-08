import React, { useState, useEffect } from 'react'
import {
  User, Mail, KeyRound, ShieldCheck, RefreshCw,
  Camera, CheckCircle2, AlertTriangle,
  Lock, ExternalLink, Unlink, Eye, EyeOff, Trash2, Shield
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/auth'
import { gmailService, type GmailStatus, type MonitoringStatus } from '../../services/gmail'
import { InteractiveHoverButton } from '../ui/interactive-hover-button'
import { ThemeToggle } from '../ui/ThemeToggle'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

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

  // Gmail & Monitoring State
  const [connectingGmail, setConnectingGmail] = useState(false)
  const [disconnectingGmail, setDisconnectingGmail] = useState(false)
  const [deletingData, setDeletingData] = useState(false)
  const [togglingMonitor, setTogglingMonitor] = useState(false)
  const [gmailMsg, setGmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isGmailConnected = gmailStatus?.is_connected ?? false
  const serverMonitoringActive = monitoringStatus?.monitoring_active ?? gmailStatus?.monitoring_active ?? false
  const [localMonitoringActive, setLocalMonitoringActive] = useState<boolean>(serverMonitoringActive)

  useEffect(() => {
    setLocalMonitoringActive(serverMonitoringActive)
  }, [serverMonitoringActive])

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
    setDisconnectingGmail(true)
    setGmailMsg(null)
    try {
      await gmailService.disconnect()
      onRefreshGmailStatus()
      setGmailMsg({ type: 'success', text: 'Gmail disconnected successfully.' })
      setTimeout(() => setGmailMsg(null), 4000)
    } catch (err: any) {
      setGmailMsg({ type: 'error', text: 'Failed to disconnect Gmail.' })
      setTimeout(() => setGmailMsg(null), 4000)
    } finally {
      setDisconnectingGmail(false)
    }
  }

  // Handle Complete Data Deletion
  const handleDeleteData = async () => {
    setDeletingData(true)
    setGmailMsg(null)
    try {
      const res = await gmailService.deleteStoredData()
      onRefreshGmailStatus()
      setGmailMsg({ type: 'success', text: res.message || 'Stored threat data and Gmail connection deleted successfully.' })
      setTimeout(() => setGmailMsg(null), 5000)
    } catch (err: any) {
      setGmailMsg({ type: 'error', text: 'Failed to delete stored security data.' })
      setTimeout(() => setGmailMsg(null), 5000)
    } finally {
      setDeletingData(false)
    }
  }

  // Handle Toggle Auto-Monitoring
  const handleToggleMonitoring = async () => {
    if (!isGmailConnected) {
      setGmailMsg({ type: 'error', text: 'Please connect your Gmail account above before enabling automated monitoring.' })
      setTimeout(() => setGmailMsg(null), 4000)
      return
    }
    if (togglingMonitor) return

    const nextState = !localMonitoringActive
    setLocalMonitoringActive(nextState)
    setTogglingMonitor(true)
    setGmailMsg(null)

    try {
      if (nextState) {
        await gmailService.startMonitoring()
      } else {
        await gmailService.stopMonitoring()
      }
      await onRefreshGmailStatus()
      setGmailMsg({
        type: 'success',
        text: `Automated Gmail monitoring is now ${nextState ? 'ACTIVE (scans every 60s)' : 'DISABLED'}.`,
      })
      setTimeout(() => setGmailMsg(null), 4000)
    } catch (err: any) {
      setLocalMonitoringActive(!nextState)
      setGmailMsg({ type: 'error', text: err?.message || 'Failed to toggle Gmail monitoring.' })
    } finally {
      setTogglingMonitor(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in font-body">
      {/* Page Header Card */}
      <div className="bg-[#0A0A0A] rounded-2xl p-6 sm:p-8 border border-[#2A2A2A] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name || 'Avatar'}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-[#FF1E2D]/40 shadow-lg shadow-[#FF1E2D]/20"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#E50914] to-[#8B0000] text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-[#E50914]/30">
                {name ? name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U'}
              </div>
            )}
            <label
              htmlFor="avatar-upload-header"
              className="absolute -bottom-1 -right-1 p-1.5 bg-[#E50914] hover:bg-[#FF1E2D] text-white rounded-xl shadow-md cursor-pointer transition-all"
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
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-xl sm:text-2xl font-black text-[#F5F5F5] tracking-tight">
                {user?.name || 'Account Settings'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-[#FF1E2D]/15 text-[#FF1E2D] border border-[#FF1E2D]/30">
                {user?.role || 'User'}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-mono text-[#737373] mt-1">
              {user?.email} &bull; Security & Profile Management
            </p>
          </div>
        </div>

        {/* Global Status & Theme Controls in Profile Header */}
        <div className="flex items-center gap-3">
          <ThemeToggle variant="dropdown" showLabel={true} />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-mono font-bold ${
            isGmailConnected
              ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
              : 'bg-[#181818] border-[#FF1E2D]/40 text-[#FF1E2D]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isGmailConnected ? 'bg-emerald-400 animate-pulse' : 'bg-[#FF1E2D]'}`} />
            <span>{isGmailConnected ? `Workspace: ${gmailStatus?.email_address || user?.email}` : 'Gmail Disconnected'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECTION 1: PROFILE DETAILS & AVATAR SELECTION */}
        <div className="bg-[#0A0A0A] rounded-2xl p-6 sm:p-8 border border-[#2A2A2A] shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#2A2A2A]">
            <div className="w-10 h-10 rounded-xl bg-[#FF1E2D]/10 text-[#FF1E2D] border border-[#FF1E2D]/25 flex items-center justify-center font-bold">
              <User size={20} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#F5F5F5]">Profile Information</h2>
              <p className="text-xs text-[#737373]">Customize your operator callsign and security avatar</p>
            </div>
          </div>

          {profileMsg && (
            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
              profileMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                : 'bg-[#181818] border-[#FF1E2D]/50 text-[#FF1E2D]'
            }`}>
              {profileMsg.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-[#FF1E2D]" />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Display Name */}
            <div>
              <label className="block text-[11px] font-bold text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
                Full Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Mercer"
                className="w-full px-4 py-2.5 rounded-xl border border-[#2A2A2A] bg-[#111111] text-xs sm:text-sm font-semibold text-[#F5F5F5] focus:outline-none focus:border-[#FF1E2D] focus:ring-1 focus:ring-[#FF1E2D]/30 transition-all"
                required
              />
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="block text-[11px] font-bold text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
                Registered Operator Email (ID)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-[#2A2A2A] bg-[#141414] text-xs sm:text-sm font-mono text-[#737373] cursor-not-allowed"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-[#555555] bg-[#1F1F1F] px-2 py-0.5 rounded border border-[#2A2A2A]">
                  Fixed
                </span>
              </div>
            </div>

            {/* Avatar Selector Presets */}
            <div>
              <label className="block text-[11px] font-bold text-[#A3A3A3] mb-2 uppercase tracking-wider">
                Choose Tactical Avatar
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
                          ? 'border-[#FF1E2D] ring-2 ring-[#FF1E2D]/30 scale-105 shadow-md shadow-[#FF1E2D]/20'
                          : 'border-transparent hover:border-[#FF1E2D]/40 opacity-70 hover:opacity-100'
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
              <label className="block text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider">
                Or Upload Image / Custom URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={customAvatarInput}
                  onChange={(e) => setCustomAvatarInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-[#2A2A2A] bg-[#111111] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#FF1E2D]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAvatarInput.trim()) {
                      setAvatarUrl(customAvatarInput.trim())
                      setCustomAvatarInput('')
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#FF1E2D]/10 hover:bg-[#FF1E2D]/20 border border-[#FF1E2D]/30 text-[#FF1E2D] text-xs font-bold cursor-pointer"
                >
                  Apply
                </button>
                <label className="px-3 py-2 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] text-[#A3A3A3] hover:text-[#F5F5F5] text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
                  <Camera size={14} />
                  <span>Upload File</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <InteractiveHoverButton
              type="submit"
              disabled={savingProfile}
              text={savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              icon={savingProfile ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} className="text-white" />}
              className="w-full py-2.5 rounded-xl bg-[#E50914] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#E50914]/20 border-[#E50914]"
            />
          </form>
        </div>

        {/* SECTION 2: PASSWORD CHANGE FORM */}
        <div className="bg-[#0A0A0A] rounded-2xl p-6 sm:p-8 border border-[#2A2A2A] shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#2A2A2A]">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/25 flex items-center justify-center font-bold">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#F5F5F5]">Change Password</h2>
              <p className="text-xs text-[#737373]">Update your account authentication credentials</p>
            </div>
          </div>

          {passMsg && (
            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
              passMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                : 'bg-[#181818] border-[#FF1E2D]/50 text-[#FF1E2D]'
            }`}>
              {passMsg.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-[#FF1E2D]" />}
              <span>{passMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
                Current Password (Optional if OAuth)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#2A2A2A] bg-[#111111] text-xs sm:text-sm font-semibold text-[#F5F5F5] focus:outline-none focus:border-[#FF1E2D] focus:ring-1 focus:ring-[#FF1E2D]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#F5F5F5] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
                New Password (Min. 6 Characters)
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong new password"
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-[#2A2A2A] bg-[#111111] text-xs sm:text-sm font-semibold text-[#F5F5F5] focus:outline-none focus:border-[#FF1E2D] focus:ring-1 focus:ring-[#FF1E2D]/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-[#2A2A2A] bg-[#111111] text-xs sm:text-sm font-semibold text-[#F5F5F5] focus:outline-none focus:border-[#FF1E2D] focus:ring-1 focus:ring-[#FF1E2D]/30 transition-all"
              />
            </div>

            <div className="pt-2">
              <InteractiveHoverButton
                type="submit"
                disabled={changingPass}
                text={changingPass ? 'Updating Credentials...' : 'Update Password'}
                icon={changingPass ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} className="text-white" />}
                className="w-full py-2.5 rounded-xl bg-[#181818] hover:bg-[#222222] text-white font-bold text-xs sm:text-sm shadow-md border-[#2A2A2A]"
              />
            </div>
          </form>
        </div>
      </div>

      {/* SECTION 3: INTERFACE THEME & APPEARANCE */}
      <div className="bg-[#0A0A0A] rounded-2xl p-6 sm:p-8 border border-[#2A2A2A] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#F5F5F5]">Interface Theme Preference</h2>
            <p className="text-xs text-[#737373] mt-0.5">
              Choose your preferred visual mode. CyberTrace Red signature accents remain consistent across all themes.
            </p>
          </div>
          <ThemeToggle variant="segmented" />
        </div>
      </div>

      {/* SECTION 4: CENTRALIZED GMAIL CONNECTION & OAUTH MANAGEMENT */}
      <div className="bg-[#0A0A0A] rounded-2xl p-6 sm:p-8 border border-[#2A2A2A] shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF1E2D]/10 text-[#FF1E2D] border border-[#FF1E2D]/25 flex items-center justify-center font-bold">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#F5F5F5]">Gmail Ingestion & OAuth Integration</h2>
              <p className="text-xs text-[#737373]">
                Authorize Google Workspace API to enable automated live threat inspection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border ${
              isGmailConnected
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                : 'bg-[#181818] text-[#FF1E2D] border-[#FF1E2D]/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isGmailConnected ? 'bg-emerald-400 animate-pulse' : 'bg-[#FF1E2D]'}`} />
              {isGmailConnected ? 'Connected & Authorized' : 'Not Connected'}
            </span>
          </div>
        </div>

        {gmailMsg && (
          <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
            gmailMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
              : 'bg-[#181818] border-[#FF1E2D]/50 text-[#FF1E2D]'
          }`}>
            {gmailMsg.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-[#FF1E2D]" />}
            <span>{gmailMsg.text}</span>
          </div>
        )}

        {/* In-Product Google Limited Use Disclosure */}
        <div className="p-4 rounded-xl bg-[#111111] border border-[#2A2A2A] text-xs text-[#A3A3A3] flex items-start gap-3">
          <Shield size={18} className="text-[#FF1E2D] mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold text-[#F5F5F5]">Google API Services User Data Policy & Limited Use Disclosure</p>
            <p className="leading-relaxed text-[11px] sm:text-xs text-[#737373]">
              By connecting Gmail, you authorize CyberTrace to access email metadata and message text in read-only mode (<code className="font-mono bg-[#181818] text-[#FF1E2D] px-1 py-0.5 rounded border border-[#2A2A2A]">gmail.readonly</code>) strictly to perform automated security threat detection. CyberTrace adheres to the Google API Services User Data Policy, including Limited Use requirements. Your email data is never sold, never used for advertising, and never used to train generalized AI models.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Connection Actions */}
          <div className="p-5 rounded-xl bg-[#111111] border border-[#2A2A2A] space-y-4">
            <h3 className="font-heading text-sm font-bold text-[#F5F5F5]">Connection Status</h3>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              {isGmailConnected
                ? `Authorized account: ${gmailStatus?.email_address || user?.email}. Token refresh daemon active.`
                : 'Connect your Gmail account via Google OAuth 2.0 to scan inbox emails directly with Gemini AI security model.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {isGmailConnected ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div>
                      <InteractiveHoverButton
                        disabled={disconnectingGmail}
                        text={disconnectingGmail ? 'Disconnecting...' : 'Disconnect Account'}
                        icon={disconnectingGmail ? <RefreshCw size={14} className="animate-spin" /> : <Unlink size={14} className="text-amber-400" />}
                        className="px-4 py-2.5 rounded-xl bg-amber-950/40 text-amber-400 border-amber-800/40 text-xs font-bold shadow-xs hover:bg-amber-900/50"
                      />
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#0A0A0A] border-[#2A2A2A] text-[#F5F5F5]">
                    <AlertDialogHeader>
                      <AlertDialogMedia className="bg-amber-950/40 text-amber-400 border-amber-800/40">
                        <Unlink size={24} />
                      </AlertDialogMedia>
                      <AlertDialogTitle className="text-[#F5F5F5]">Disconnect Google Workspace / Gmail?</AlertDialogTitle>
                      <AlertDialogDescription className="text-[#A3A3A3]">
                        This will immediately revoke active Google OAuth 2.0 access, pause the 60-second automated inbox threat monitoring, and stop real-time alerts. You can reconnect your Gmail account at any time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-[#181818] border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#222222]">Keep Connected</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDisconnectGmail}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Disconnect Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <InteractiveHoverButton
                  onClick={handleConnectGmail}
                  disabled={connectingGmail}
                  text={connectingGmail ? 'Redirecting to Google...' : 'Connect Gmail Account'}
                  icon={connectingGmail ? <RefreshCw size={14} className="animate-spin" /> : <ExternalLink size={14} className="text-white" />}
                  className="px-5 py-2.5 rounded-xl bg-[#E50914] text-white text-xs font-bold shadow-md shadow-[#E50914]/20 border-[#E50914]"
                />
              )}
            </div>
          </div>

          {/* Automated Monitoring Controls */}
          <div className="p-5 rounded-xl bg-[#111111] border border-[#2A2A2A] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading text-sm font-bold text-[#F5F5F5]">Automated Background Monitoring</h3>
                  {localMonitoringActive && isGmailConnected ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-950/50 text-emerald-400 border border-emerald-800/60 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      ACTIVE (60s SYNC)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#181818] text-[#737373] border border-[#2A2A2A]">
                      PAUSED / MANUAL
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Automatically syncs your Gmail inbox every 60s, executes Gemini AI threat analysis, and flags zero-day exploits.
                </p>
              </div>

              {/* Animated Toggle Switch */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono font-bold text-[#A3A3A3] select-none">
                  {localMonitoringActive && isGmailConnected ? 'ON' : 'OFF'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={localMonitoringActive && isGmailConnected}
                  onClick={handleToggleMonitoring}
                  disabled={togglingMonitor}
                  title={
                    !isGmailConnected
                      ? 'Connect your Gmail account first to enable automated monitoring'
                      : localMonitoringActive
                      ? 'Click to pause automatic 60s monitoring'
                      : 'Click to enable automatic 60s monitoring'
                  }
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FF1E2D]/40 active:scale-95 ${
                    !isGmailConnected
                      ? 'bg-[#1F1F1F] cursor-not-allowed opacity-50'
                      : localMonitoringActive
                      ? 'bg-gradient-to-r from-[#FF1E2D] to-[#E50914] shadow-md shadow-[#E50914]/30'
                      : 'bg-[#2A2A2A] hover:bg-[#333333]'
                  }`}
                >
                  <span className="sr-only">Toggle automated monitoring</span>
                  <span
                    style={{
                      transform: (localMonitoringActive && isGmailConnected) ? 'translateX(28px)' : 'translateX(0px)',
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    className="pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md"
                  >
                    {togglingMonitor ? (
                      <RefreshCw size={11} className="animate-spin text-[#E50914]" />
                    ) : (localMonitoringActive && isGmailConnected) ? (
                      <span className="h-2 w-2 rounded-full bg-[#E50914]" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                    )}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-3 bg-[#181818] rounded-xl border border-[#2A2A2A]">
                <span className="text-[10px] text-[#737373] block uppercase font-mono font-bold">Auto-Processed</span>
                <span className="font-extrabold text-sm font-mono text-[#F5F5F5] mt-0.5 block">
                  {monitoringStatus?.emails_auto_processed ?? gmailStatus?.emails_auto_processed ?? 0} emails
                </span>
              </div>
              <div className="p-3 bg-[#181818] rounded-xl border border-[#2A2A2A]">
                <span className="text-[10px] text-[#737373] block uppercase font-mono font-bold">Warnings Dispatched</span>
                <span className="font-extrabold text-sm font-mono text-[#FF1E2D] mt-0.5 block">
                  {monitoringStatus?.threats_detected ?? gmailStatus?.warnings_sent ?? 0} threats
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Deletion & Privacy Control Section */}
        <div className="p-5 rounded-xl bg-[#140808] border border-[#FF1E2D]/25 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-sm font-bold text-[#FF1E2D] flex items-center gap-2">
                <Trash2 size={16} />
                Data Retention & Right to Erasure
              </h3>
              <p className="text-xs text-[#A3A3A3] mt-1 leading-relaxed max-w-xl">
                Permanently purge all your stored email scan history, threat intelligence logs, alert records, and Gmail OAuth credentials from our encrypted database.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  disabled={deletingData}
                  className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#FF1E2D] text-white text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {deletingData ? 'Deleting...' : 'Delete Stored Threat Data'}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#0A0A0A] border-[#2A2A2A] text-[#F5F5F5]">
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-[#FF1E2D]/15 text-[#FF1E2D] border-[#FF1E2D]/30">
                    <Trash2 size={24} />
                  </AlertDialogMedia>
                  <AlertDialogTitle className="text-[#F5F5F5]">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-[#A3A3A3]">
                    This action cannot be undone. This will permanently purge all your scanned email history, threat triage telemetry, and encrypted Gmail tokens from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-[#181818] border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#222222]">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteData}
                    className="bg-[#E50914] hover:bg-[#FF1E2D] text-white"
                  >
                    Confirm Permanent Deletion
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  )
}
