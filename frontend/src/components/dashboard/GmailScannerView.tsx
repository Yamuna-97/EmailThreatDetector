import React, { useState, useEffect } from 'react'
import {
  Mail, RefreshCw, Sparkles, CheckSquare, Square,
  CheckCircle2, AlertTriangle, ArrowRight, Inbox, Eye
} from 'lucide-react'
import { gmailService, type GmailStatus, type MonitoringStatus, type GmailMessagePreview } from '../../services/gmail'
import { type ThreatItem } from '../../services/threats'
import { InteractiveHoverButton } from '../ui/interactive-hover-button'

interface GmailScannerViewProps {
  gmailStatus: GmailStatus | null
  monitoringStatus?: MonitoringStatus | null
  threats?: ThreatItem[]
  onRefreshAllData: (silent?: boolean) => Promise<void>
  onNavigateToProfile: () => void
  onNavigateToEmails: () => void
  onViewThreatReport?: (threatId: string) => void
}

export const GmailScannerView: React.FC<GmailScannerViewProps> = ({
  gmailStatus,
  monitoringStatus,
  threats = [],
  onRefreshAllData,
  onNavigateToProfile,
  onNavigateToEmails,
  onViewThreatReport,
}) => {
  const [selectedLimit, setSelectedLimit] = useState<number>(5)
  const [selectedFolder, setSelectedFolder] = useState<'all' | 'inbox' | 'spam'>('all')
  const [messages, setMessages] = useState<GmailMessagePreview[]>([])
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([])
  const [fetchingMessages, setFetchingMessages] = useState(false)
  const [scanningSelected, setScanningSelected] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; threatId?: string } | null>(null)

  const handleLimitChange = (val: string | number) => {
    if (val === '') {
      setSelectedLimit(1)
      return
    }
    const num = typeof val === 'number' ? val : parseInt(val, 10)
    if (!isNaN(num)) {
      // Clamped integer between 1 and 20
      const clamped = Math.min(20, Math.max(1, Math.floor(num)))
      setSelectedLimit(clamped)
    }
  }

  const isConnected = gmailStatus?.is_connected ?? false

  const serverMonitoringActive = monitoringStatus?.monitoring_active ?? gmailStatus?.monitoring_active ?? false
  const [localMonitoringActive, setLocalMonitoringActive] = useState<boolean>(serverMonitoringActive)
  const [togglingMonitor, setTogglingMonitor] = useState(false)

  useEffect(() => {
    setLocalMonitoringActive(serverMonitoringActive)
  }, [serverMonitoringActive])

  const handleToggleMonitoring = async () => {
    if (!isConnected || togglingMonitor) return
    const nextState = !localMonitoringActive
    setLocalMonitoringActive(nextState)
    setTogglingMonitor(true)
    try {
      if (nextState) {
        await gmailService.startMonitoring()
      } else {
        await gmailService.stopMonitoring()
      }
      await onRefreshAllData(true)
      setStatusMessage({
        type: 'success',
        text: `Automated 60s background monitoring is now ${nextState ? 'ACTIVE' : 'PAUSED'}.`,
      })
      setTimeout(() => setStatusMessage(null), 4000)
    } catch (err: any) {
      setLocalMonitoringActive(!nextState)
      setStatusMessage({ type: 'error', text: 'Failed to update background monitoring status.' })
    } finally {
      setTogglingMonitor(false)
    }
  }

  const loadGmailMessages = async (silent = false) => {
    if (!isConnected) return
    if (!silent) setFetchingMessages(true)
    try {
      const res = await gmailService.fetchMessagesList(selectedLimit, selectedFolder)
      const msgList = res.messages || []
      setMessages(msgList)
      // Auto-select unscanned emails by default
      const unscanned = msgList.filter(m => !m.already_scanned).map(m => m.id)
      setSelectedMsgIds(prev => prev.length > 0 ? prev : (unscanned.length > 0 ? unscanned : msgList.map(m => m.id)))
    } catch (err: any) {
      console.error('Error fetching Gmail messages:', err)
      if (!silent) {
        setStatusMessage({ type: 'error', text: 'Could not fetch live messages from Gmail inbox.' })
      }
    } finally {
      if (!silent) setFetchingMessages(false)
    }
  }

  useEffect(() => {
    if (isConnected) {
      loadGmailMessages()
    }
  }, [isConnected, selectedLimit, selectedFolder])

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
      const firstThreat = (res.threats && res.threats.length > 0) ? res.threats[0] : null
      setStatusMessage({
        type: 'success',
        text: `Analysis complete for ${res.scanned_count || selectedMsgIds.length} email(s)! ${res.threats_detected || 0} threat(s) flagged.`,
        threatId: firstThreat?.id,
      })
      await onRefreshAllData(true)
      await loadGmailMessages(true)
    } catch (err: any) {
      console.error('Error scanning selected:', err)
      setStatusMessage({ type: 'error', text: 'Failed to complete threat analysis for selected emails.' })
    } finally {
      setScanningSelected(false)
    }
  }

  const handleScanSingle = async (msgId: string) => {
    setScanningSelected(true)
    setStatusMessage(null)
    try {
      const res = await gmailService.scanSelected([msgId])
      const scannedThreat = (res.threats && res.threats.length > 0) ? res.threats[0] : null
      setStatusMessage({
        type: 'success',
        text: `Email analyzed! Result: ${res.threats_detected > 0 ? '⚠️ Threat Detected' : '✅ Verified Safe'}.`,
        threatId: scannedThreat?.id,
      })
      await onRefreshAllData(true)
      await loadGmailMessages(true)
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Scan failed for this message.' })
    } finally {
      setScanningSelected(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="dash-card p-10 sm:p-14 text-center max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Icon */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500/15 to-rose-500/5 border border-rose-200 flex items-center justify-center mx-auto">
            <Mail size={36} className="text-rose-600" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-rose-500 flex items-center justify-center shadow-md">
            <span className="text-white text-xs font-extrabold">!</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-[#192837]">
            Gmail Account Not Connected
          </h2>
          <p className="text-sm text-[#192837]/60 leading-relaxed max-w-md mx-auto">
            Authorize your Google account to preview and scan live Gmail messages directly through CyberTrace's threat detection pipeline.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onNavigateToProfile}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7342E2] hover:bg-[#6032C4] text-white font-bold text-sm shadow-md shadow-[#7342E2]/25 transition-all cursor-pointer"
          >
            Open Profile & Connect Gmail
            <ArrowRight size={15} />
          </button>
          <div className="status-pill disconnected">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Gmail Disconnected
          </div>
        </div>

        {/* Benefits list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { label: 'Live Preview', desc: 'See inbox messages before scanning' },
            { label: 'Batch Analysis', desc: 'Scan multiple emails at once' },
            { label: 'Auto Monitoring', desc: '60s background sync protection' },
          ].map(({ label, desc }) => (
            <div key={label} className="p-3.5 rounded-xl bg-[#F8F9FC] border border-[rgba(115,66,226,0.08)] text-left">
              <span className="text-xs font-bold text-[#192837] block">{label}</span>
              <span className="text-[11px] text-[#192837]/45 mt-0.5 block">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-[#192837]">Gmail Ingestion & Threat Scanner</h1>
        <div className="flex items-center gap-2 mt-1">
          <div className="status-pill connected">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {gmailStatus?.email_address || 'Connected'}
          </div>
          <span className="text-xs text-[#192837]/45">Live Google Workspace mailbox</span>
        </div>
      </div>

      {/* Top Controls Card */}
      <div className="dash-card p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[rgba(115,66,226,0.08)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7342E2] to-[#9B70F6] text-white flex items-center justify-center shadow-sm shadow-[#7342E2]/25">
              <Mail size={18} />
            </div>
            <div>
              <h2 className="font-heading text-sm font-bold text-[#192837]">Scan Controls</h2>
              <p className="text-[11px] text-[#192837]/45">Select messages and run threat analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadGmailMessages(false)}
              disabled={fetchingMessages}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8F9FC] hover:bg-[#F5F3FF] border border-[rgba(115,66,226,0.12)] text-xs font-bold text-[#192837] cursor-pointer disabled:opacity-50 transition-all"
            >
              <RefreshCw size={13} className={fetchingMessages ? 'animate-spin' : ''} />
              Refresh Mailbox
            </button>
            <button
              type="button"
              onClick={onNavigateToEmails}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-[#E0D9FF] text-xs font-bold text-[#7342E2] cursor-pointer transition-all"
            >
              View Analyzed Threats
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Automated Background Monitoring Toggle */}
        <div className="p-4 rounded-2xl bg-[#F8F9FC] border border-[rgba(115,66,226,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              localMonitoringActive ? 'bg-emerald-500/15 text-emerald-600' : 'bg-[#192837]/5 text-[#192837]/50'
            }`}>
              <Sparkles size={18} className={localMonitoringActive ? 'animate-pulse' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#192837]">Automated Background Monitoring</span>
                {localMonitoringActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    ACTIVE (60s SYNC)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#192837]/10 text-[#192837]/60">
                    PAUSED / MANUAL
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#192837]/60 mt-0.5">
                Automatically scans incoming messages every 60 seconds in the background without refreshing your page
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <span className="text-xs font-bold text-[#192837]/70 select-none">
              {localMonitoringActive ? 'ON' : 'OFF'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={localMonitoringActive}
              onClick={handleToggleMonitoring}
              disabled={togglingMonitor}
              title={localMonitoringActive ? 'Click to pause automatic 60s monitoring' : 'Click to enable automatic 60s monitoring'}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7342E2]/30 active:scale-95 ${
                localMonitoringActive
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7342E2] shadow-md shadow-[#7342E2]/30'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            >
              <span className="sr-only">Toggle automated monitoring</span>
              <span
                style={{
                  transform: localMonitoringActive ? 'translateX(28px)' : 'translateX(0px)',
                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md"
              >
                {togglingMonitor ? (
                  <RefreshCw size={11} className="animate-spin text-[#7342E2]" />
                ) : localMonitoringActive ? (
                  <span className="h-2 w-2 rounded-full bg-[#7342E2]" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {/* Email Count Limit (Typeable Integer Range 1-20, Default: 5) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#192837] uppercase tracking-wider">
                Scan Range (1–20)
              </label>
              <span className="text-[10px] text-[#7342E2] font-bold">
                Default: 5 &bull; Max: 20
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={selectedLimit}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#192837]/15 focus:border-[#7342E2] focus:ring-2 focus:ring-[#7342E2]/20 text-xs font-extrabold text-[#192837] text-center transition-all outline-none"
                  placeholder="5"
                />
              </div>
              <div className="flex items-center gap-1">
                {[1, 5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleLimitChange(num)}
                    className={`px-2 py-2 rounded-xl text-[11px] font-extrabold transition-all border cursor-pointer ${
                      selectedLimit === num
                        ? 'bg-[#7342E2] text-white border-[#7342E2] shadow-xs'
                        : 'bg-[#FAF9F6] text-[#192837]/70 border-[#192837]/10 hover:border-[#7342E2]/40'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Folder Target */}
          <div>
            <label className="block text-xs font-bold text-[#192837] mb-1.5 uppercase tracking-wider">
              Target Folder
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['all', 'inbox', 'spam'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelectedFolder(f)}
                  className={`py-2 rounded-xl text-xs font-extrabold capitalize transition-all border cursor-pointer ${
                    selectedFolder === f
                      ? 'bg-[#7342E2] text-white border-[#7342E2] shadow-sm'
                      : 'bg-[#FAF9F6] text-[#192837]/70 border-[#192837]/10 hover:border-[#7342E2]/40'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col justify-end">
            <InteractiveHoverButton
              disabled={scanningSelected || selectedMsgIds.length === 0}
              onClick={handleScanSelected}
              text={scanningSelected ? `Gemini AI Analyzing (${selectedMsgIds.length})...` : `Scan Selected (${selectedMsgIds.length} Emails)`}
              icon={scanningSelected ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} className="text-white" />}
              className="w-full py-2.5 rounded-xl bg-[#7342E2] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#7342E2]/25 border-[#7342E2]"
            />
          </div>
        </div>
      </div>

      {/* Analysis Result Banner with Direct Report Access */}
      {statusMessage && (
        <div className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 border shadow-sm animate-fade-in ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
            : 'bg-red-50/90 border-red-300 text-red-900'
        }`}>
          <div className="flex items-center gap-3">
            {statusMessage.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={20} className="text-red-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {statusMessage.threatId && onViewThreatReport && (
              <button
                type="button"
                onClick={() => onViewThreatReport(statusMessage.threatId!)}
                className="px-3.5 py-1.5 rounded-xl bg-[#7342E2] hover:bg-[#6332d2] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Eye size={14} />
                <span>View Analytics Dossier</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-xs opacity-60 hover:opacity-100 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages List Card */}
      <div className="dash-card overflow-hidden">
        {/* Table Header / Selection Bar */}
        <div className="px-6 py-4 border-b border-[rgba(115,66,226,0.08)] bg-[#F8F9FC] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              disabled={messages.length === 0}
              className="text-[#7342E2] hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-2 text-xs font-bold"
            >
              {selectedMsgIds.length === messages.length && messages.length > 0 ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} className="text-[#192837]/40" />
              )}
              <span>Select All ({messages.length})</span>
            </button>
            <span className="text-xs text-[#192837]/50">
              &bull; {selectedMsgIds.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {fetchingMessages && (
              <span className="text-xs text-[#7342E2] font-semibold flex items-center gap-1">
                <RefreshCw size={12} className="animate-spin" />
                Updating...
              </span>
            )}
            <span className="text-xs text-[#192837]/60 font-semibold">
              Showing latest {messages.length} message(s)
            </span>
          </div>
        </div>

        {fetchingMessages && messages.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw size={28} className="animate-spin text-[#7342E2] mx-auto" />
            <p className="text-xs sm:text-sm font-semibold text-[#192837]/70">
              Retrieving live emails from your Google Workspace account...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Inbox size={32} className="text-[#192837]/30 mx-auto" />
            <p className="text-xs sm:text-sm font-semibold text-[#192837]/60">
              No emails found in this folder ({selectedFolder}).
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(115,66,226,0.06)]">
            {messages.map((m) => {
              const isSelected = selectedMsgIds.includes(m.id)
              const matchingThreat = threats.find(t => t.email_id === m.id || (t as any).message_id === m.id || t.id === m.id)
              
              const isDanger = matchingThreat && (matchingThreat.risk_score >= 60 || matchingThreat.severity === 'critical' || matchingThreat.severity === 'high')
              const isModerate = matchingThreat && (matchingThreat.risk_score >= 30 && matchingThreat.risk_score < 60)

              return (
                <div
                  key={m.id}
                  className={`p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all ${
                    isSelected ? 'bg-[#F8F7FF]' : 'hover:bg-[#FAFAFA]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleMsg(m.id)}
                    className="mt-0.5 text-[#7342E2] cursor-pointer shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} className="text-[#192837]/30 hover:text-[#7342E2]" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-heading font-bold text-xs sm:text-sm text-[#192837] truncate max-w-md">
                        {m.subject || '(No Subject)'}
                      </span>
                      <span className="text-[11px] text-[#192837]/50 whitespace-nowrap">
                        {m.date || 'Recent'}
                      </span>
                    </div>

                    <p className="text-xs text-[#192837]/70 truncate">
                      <b className="text-[#192837] font-semibold">From:</b> {m.sender}
                    </p>

                    <p className="text-xs text-[#192837]/60 line-clamp-1 font-body">
                      {m.snippet || '(empty preview)'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1.5">
                      {matchingThreat ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isDanger
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : isModerate
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {isDanger ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                          {matchingThreat.threat_type} ({matchingThreat.risk_score}/100)
                        </span>
                      ) : m.already_scanned ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          <CheckCircle2 size={11} />
                          Already Scanned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                          Pending Scan
                        </span>
                      )}

                      {matchingThreat && onViewThreatReport && (
                        <button
                          type="button"
                          onClick={() => onViewThreatReport(matchingThreat.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#7342E2] text-white text-[11px] font-bold hover:brightness-110 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Eye size={12} />
                          <span>View Analytics Report</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleScanSingle(m.id)}
                        disabled={scanningSelected}
                        className="px-2.5 py-1 rounded-lg bg-[#7342E2]/10 hover:bg-[#7342E2]/20 text-[#7342E2] text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles size={11} />
                        <span>{m.already_scanned ? 'Re-Analyze' : 'Scan Now'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
