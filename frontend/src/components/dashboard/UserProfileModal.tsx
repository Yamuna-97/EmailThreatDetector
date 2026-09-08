import React, { useState, useEffect } from 'react'
import {
  X, Mail, CheckCircle2, AlertTriangle, RefreshCw,
  Sparkles, ShieldCheck, CheckSquare, Square, Unlink
} from 'lucide-react'
import { gmailService, type GmailStatus, type MonitoringStatus, type GmailMessagePreview } from '../../services/gmail'
import { useAuth } from '../../context/AuthContext'
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

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  gmailStatus: GmailStatus | null
  monitoringStatus: MonitoringStatus | null
  onRefreshStatus: () => void
  onScanCompleted: () => void
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  gmailStatus,
  monitoringStatus,
  onRefreshStatus,
  onScanCompleted,
}) => {
  const { user } = useAuth()
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [togglingMonitor, setTogglingMonitor] = useState(false)
  const [selectedLimit, setSelectedLimit] = useState<number>(5)
  const [selectedFolder, setSelectedFolder] = useState<'all' | 'inbox' | 'spam'>('all')
  const [messages, setMessages] = useState<GmailMessagePreview[]>([])
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([])
  const [fetchingMessages, setFetchingMessages] = useState(false)
  const [scanningSelected, setScanningSelected] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleLimitChange = (val: string | number) => {
    if (val === '') {
      setSelectedLimit(1)
      return
    }
    const num = typeof val === 'number' ? val : parseInt(val, 10)
    if (!isNaN(num)) {
      const clamped = Math.min(20, Math.max(1, Math.floor(num)))
      setSelectedLimit(clamped)
    }
  }

  const isConnected = gmailStatus?.is_connected ?? false
  const serverMonitoringActive = monitoringStatus?.monitoring_active ?? gmailStatus?.monitoring_active ?? false
  const [localMonitoringActive, setLocalMonitoringActive] = useState<boolean>(serverMonitoringActive)

  useEffect(() => {
    setLocalMonitoringActive(serverMonitoringActive)
  }, [serverMonitoringActive])

  const loadGmailMessages = async () => {
    setFetchingMessages(true)
    setStatusMessage(null)
    try {
      const res = await gmailService.fetchMessagesList(selectedLimit, selectedFolder)
      setMessages(res.messages || [])
      const unscanned = (res.messages || []).filter(m => !m.already_scanned).map(m => m.id)
      setSelectedMsgIds(unscanned)
    } catch (err: any) {
      console.error('Error fetching Gmail list:', err)
      setStatusMessage({ type: 'error', text: 'Could not fetch messages from Gmail.' })
    } finally {
      setFetchingMessages(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadGmailMessages()
    }
  }, [isOpen, selectedLimit, selectedFolder])

  if (!isOpen) return null

  const handleConnectGmail = async () => {
    setConnecting(true)
    setStatusMessage(null)
    try {
      const res = await gmailService.connect()
      if (res.auth_url) {
        window.location.href = res.auth_url
      }
    } catch (err: any) {
      console.error('Failed to initiate Gmail OAuth:', err)
      setStatusMessage({ type: 'error', text: 'Failed to initialize Google OAuth session.' })
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnectGmail = async () => {
    setDisconnecting(true)
    setStatusMessage(null)
    try {
      await gmailService.disconnect()
      onRefreshStatus()
      setStatusMessage({ type: 'success', text: 'Gmail disconnected successfully.' })
      setTimeout(() => setStatusMessage(null), 4000)
    } catch (err: any) {
      console.error('Failed to disconnect Gmail:', err)
      setStatusMessage({ type: 'error', text: 'Failed to disconnect Gmail.' })
      setTimeout(() => setStatusMessage(null), 4000)
    } finally {
      setDisconnecting(false)
    }
  }

  const handleToggleAutoMonitoring = async () => {
    if (!isConnected || togglingMonitor) return
    const nextState = !localMonitoringActive
    setLocalMonitoringActive(nextState)
    setTogglingMonitor(true)
    setStatusMessage(null)
    try {
      if (nextState) {
        await gmailService.startMonitoring()
      } else {
        await gmailService.stopMonitoring()
      }
      onRefreshStatus()
      setStatusMessage({
        type: 'success',
        text: `Automatic Gmail monitoring is now ${nextState ? 'ACTIVE' : 'DISABLED'}.`,
      })
    } catch (err: any) {
      setLocalMonitoringActive(!nextState)
      console.error('Failed to toggle monitoring:', err)
      setStatusMessage({ type: 'error', text: 'Failed to update auto monitoring status.' })
    } finally {
      setTogglingMonitor(false)
    }
  }

  const handleToggleSelectAll = () => {
    if (selectedMsgIds.length === messages.length) {
      setSelectedMsgIds([])
    } else {
      setSelectedMsgIds(messages.map(m => m.id))
    }
  }

  const handleToggleMsg = (id: string) => {
    setSelectedMsgIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleScanSelected = async () => {
    if (selectedMsgIds.length === 0) return
    setScanningSelected(true)
    setStatusMessage(null)
    try {
      const res = await gmailService.scanSelected(selectedMsgIds)
      setStatusMessage({
        type: 'success',
        text: `Successfully scanned ${res.scanned_count || selectedMsgIds.length} emails! ${res.threats_detected || 0} threats detected.`,
      })
      onScanCompleted()
      loadGmailMessages()
    } catch (err: any) {
      console.error('Error scanning selected:', err)
      setStatusMessage({ type: 'error', text: 'Failed to scan selected emails.' })
    } finally {
      setScanningSelected(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in font-body">
      <div className="bg-[#0A0A0A] rounded-2xl border border-[#2A2A2A] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-[#F5F5F5]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2A2A2A] flex items-center justify-between bg-[#111111] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50914] to-[#8B0000] text-white flex items-center justify-center font-heading font-black text-lg shadow-md shadow-[#E50914]/25">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="font-heading text-lg font-black text-[#F5F5F5] leading-tight">
                {user?.name || 'User Profile'}
              </h2>
              <p className="text-xs text-[#737373]">
                {user?.email} &bull; <span className="capitalize font-mono font-semibold text-[#FF1E2D]">{user?.role || 'User'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#181818] hover:bg-[#222222] text-[#737373] hover:text-[#F5F5F5] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Notification Banner */}
        {statusMessage && (
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 border-b ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
              : 'bg-[#181818] text-[#FF1E2D] border-[#FF1E2D]/40'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={14} className="text-emerald-400" /> : <AlertTriangle size={14} className="text-[#FF1E2D]" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: User Account Details */}
          <div className="p-5 rounded-xl bg-[#111111] border border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#737373]">
                Account Security Status
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
                  <ShieldCheck size={12} /> Active Protected
                </span>
                <span className="text-xs text-[#737373]">
                  User ID: <code className="font-mono text-[11px] text-[#FF1E2D]">{user?.id?.slice(0, 12)}...</code>
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Gmail Ingestion */}
          <div className="p-6 rounded-xl bg-[#111111] border border-[#2A2A2A] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-base font-bold text-[#F5F5F5]">
                    Gmail Ingestion
                  </h3>
                  <span className="text-xs font-mono text-[#737373]">
                    Google OAuth 2.0 API
                  </span>
                </div>
                <p className="text-xs text-[#A3A3A3] mt-1 max-w-lg">
                  Authorize Google OAuth 2.0 to scan inbox emails directly with Gemini AI security model.
                </p>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#181818] text-[#FF1E2D] border border-[#FF1E2D]/30">
                    <span className="w-2 h-2 rounded-full bg-[#FF1E2D]" />
                    Disconnected
                  </span>
                )}
              </div>
            </div>

            {/* Connection Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {!isConnected ? (
                <button
                  type="button"
                  onClick={handleConnectGmail}
                  disabled={connecting}
                  className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#FF1E2D] text-white text-xs font-bold shadow-md shadow-[#E50914]/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Mail size={15} />
                  <span>{connecting ? 'Connecting...' : 'Connect Gmail Account'}</span>
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2 bg-[#181818] border border-[#2A2A2A] px-3 py-1.5 rounded-xl shadow-xs">
                    <span className="text-xs font-mono font-bold text-[#A3A3A3]">
                      Auto Monitoring: {localMonitoringActive ? 'ON' : 'OFF'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={localMonitoringActive}
                      onClick={handleToggleAutoMonitoring}
                      disabled={togglingMonitor}
                      title={localMonitoringActive ? 'Click to pause automated monitoring' : 'Click to enable automated monitoring'}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FF1E2D]/40 active:scale-95 ${
                        localMonitoringActive
                          ? 'bg-gradient-to-r from-[#FF1E2D] to-[#E50914] shadow-sm shadow-[#E50914]/30'
                          : 'bg-[#2A2A2A] hover:bg-[#333333]'
                      }`}
                    >
                      <span className="sr-only">Toggle auto monitoring</span>
                      <span
                        style={{
                          transform: localMonitoringActive ? 'translateX(20px)' : 'translateX(0px)',
                          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        className="pointer-events-none flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm"
                      >
                        {togglingMonitor ? (
                          <RefreshCw size={9} className="animate-spin text-[#E50914]" />
                        ) : localMonitoringActive ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#E50914]" />
                        ) : (
                          <span className="h-1 w-1 rounded-full bg-neutral-400" />
                        )}
                      </span>
                    </button>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        disabled={disconnecting}
                        className="px-3.5 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 text-amber-400 border border-amber-800/40 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {disconnecting ? 'Disconnecting...' : 'Disconnect Account'}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#0A0A0A] border-[#2A2A2A] text-[#F5F5F5]">
                      <AlertDialogHeader>
                        <AlertDialogMedia className="bg-amber-950/40 text-amber-400 border-amber-800/40">
                          <Unlink size={24} />
                        </AlertDialogMedia>
                        <AlertDialogTitle className="text-[#F5F5F5]">Disconnect Google Workspace / Gmail?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#A3A3A3]">
                          This will immediately revoke your active Google OAuth session, stop automated inbox monitoring, and pause real-time alerts. You can reconnect your Gmail account at any time.
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
                </>
              )}
            </div>
          </div>

          {/* Section 3: Live Gmail Scanner & Email Selector */}
          <div className="p-6 rounded-xl bg-[#111111] border border-[#2A2A2A] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                  <span>Gmail Live Email Scanner</span>
                  <span className="text-[10px] font-mono uppercase font-bold bg-[#FF1E2D]/15 text-[#FF1E2D] border border-[#FF1E2D]/30 px-2 py-0.5 rounded-md">
                    Select & Scan
                  </span>
                </h3>
                <p className="text-xs text-[#A3A3A3] mt-0.5">
                  Choose how many emails to fetch, review them, and select exactly which ones to scan with Gemini AI.
                </p>
              </div>

              {/* Limit Picker: 1–20 (Default: 5) */}
              <div className="flex items-center gap-1.5 bg-[#181818] p-1.5 rounded-xl border border-[#2A2A2A]">
                <input
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={selectedLimit}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  className="w-12 px-1.5 py-1 text-xs font-mono font-bold text-[#F5F5F5] bg-[#111111] border border-[#2A2A2A] rounded-lg text-center outline-none focus:border-[#FF1E2D]"
                  placeholder="5"
                />
                {[1, 5, 10, 15, 20].map(limit => (
                  <button
                    key={limit}
                    type="button"
                    onClick={() => handleLimitChange(limit)}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedLimit === limit
                        ? 'bg-[#E50914] text-white shadow-xs'
                        : 'text-[#737373] hover:text-[#F5F5F5]'
                    }`}
                  >
                    {limit}
                  </button>
                ))}
              </div>
            </div>

            {/* Folder & Refresh Controls */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#2A2A2A]">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {(['all', 'inbox', 'spam'] as const).map((folder) => (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => setSelectedFolder(folder)}
                    className={`px-3 py-1 rounded-lg capitalize transition-all ${
                      selectedFolder === folder
                        ? 'bg-[#FF1E2D]/15 text-[#FF1E2D] border border-[#FF1E2D]/30 font-bold'
                        : 'text-[#737373] hover:text-[#F5F5F5]'
                    }`}
                  >
                    {folder === 'all' ? 'All Folders' : folder}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-bold text-[#FF1E2D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {selectedMsgIds.length === messages.length && messages.length > 0 ? (
                    <>
                      <CheckSquare size={13} /> Deselect All
                    </>
                  ) : (
                    <>
                      <Square size={13} /> Select All ({messages.length})
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={loadGmailMessages}
                  disabled={fetchingMessages}
                  title="Reload Messages"
                  className="p-1.5 rounded-lg text-[#737373] hover:text-[#FF1E2D] hover:bg-[#181818] border border-[#2A2A2A] cursor-pointer"
                >
                  <RefreshCw size={13} className={fetchingMessages ? 'animate-spin text-[#FF1E2D]' : ''} />
                </button>
              </div>
            </div>

            {/* Email List Preview */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-[#1F1F1F]">
              {fetchingMessages ? (
                <div className="py-8 text-center text-xs text-[#737373] flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-[#FF1E2D]" />
                  <span>Fetching latest {selectedLimit} emails from Gmail...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#737373]">
                  No emails found in this folder.
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelected = selectedMsgIds.includes(msg.id)
                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleToggleMsg(msg.id)}
                      className={`pt-2.5 pb-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-[#181818] border-[#FF1E2D]/40'
                          : 'bg-[#0A0A0A] border-[#2A2A2A] hover:border-[#333333]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 accent-[#E50914] cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-[#F5F5F5] truncate">
                            {msg.sender}
                          </span>
                          <span className="text-[10px] font-mono text-[#737373] shrink-0">
                            {msg.date}
                          </span>
                        </div>
                        <p className="font-semibold text-xs text-[#A3A3A3] truncate mt-0.5">
                          {msg.subject}
                        </p>
                        <p className="text-[11px] text-[#737373] truncate mt-0.5">
                          {msg.snippet}
                        </p>
                      </div>
                      {msg.already_scanned && (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full shrink-0">
                          Scanned
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Scan Action */}
            <div className="pt-2 flex items-center justify-between border-t border-[#2A2A2A]">
              <span className="text-xs text-[#737373] font-mono">
                {selectedMsgIds.length} email{selectedMsgIds.length === 1 ? '' : 's'} selected
              </span>
              <button
                type="button"
                onClick={handleScanSelected}
                disabled={selectedMsgIds.length === 0 || scanningSelected}
                className="px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#FF1E2D] active:scale-95 text-white text-xs font-bold shadow-lg shadow-[#E50914]/25 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Sparkles size={14} className={scanningSelected ? 'animate-spin' : ''} />
                <span>{scanningSelected ? 'Scanning Selected...' : `Scan Selected Emails (${selectedMsgIds.length})`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfileModal
