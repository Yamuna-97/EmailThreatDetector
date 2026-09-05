import React, { useState, useEffect } from 'react'
import {
  Mail, RefreshCw, Sparkles, CheckSquare, Square,
  CheckCircle2, AlertTriangle, ArrowRight, Inbox
} from 'lucide-react'
import { gmailService, type GmailStatus, type MonitoringStatus, type GmailMessagePreview } from '../../services/gmail'

interface GmailScannerViewProps {
  gmailStatus: GmailStatus | null
  monitoringStatus?: MonitoringStatus | null
  onRefreshAllData: () => Promise<void>
  onNavigateToProfile: () => void
  onNavigateToEmails: () => void
}

export const GmailScannerView: React.FC<GmailScannerViewProps> = ({
  gmailStatus,
  onRefreshAllData,
  onNavigateToProfile,
  onNavigateToEmails,
}) => {
  const [selectedLimit, setSelectedLimit] = useState<number>(10)
  const [selectedFolder, setSelectedFolder] = useState<'all' | 'inbox' | 'spam'>('all')
  const [messages, setMessages] = useState<GmailMessagePreview[]>([])
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([])
  const [fetchingMessages, setFetchingMessages] = useState(false)
  const [scanningSelected, setScanningSelected] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isConnected = gmailStatus?.is_connected ?? false

  const loadGmailMessages = async () => {
    if (!isConnected) return
    setFetchingMessages(true)
    setStatusMessage(null)
    try {
      const res = await gmailService.fetchMessagesList(selectedLimit, selectedFolder)
      const msgList = res.messages || []
      setMessages(msgList)
      // Auto-select unscanned emails by default
      const unscanned = msgList.filter(m => !m.already_scanned).map(m => m.id)
      setSelectedMsgIds(unscanned.length > 0 ? unscanned : msgList.map(m => m.id))
    } catch (err: any) {
      console.error('Error fetching Gmail messages:', err)
      setStatusMessage({ type: 'error', text: 'Could not fetch live messages from Gmail inbox.' })
    } finally {
      setFetchingMessages(false)
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
      setStatusMessage({
        type: 'success',
        text: `Scanned ${res.scanned_count || selectedMsgIds.length} email(s) successfully! ${res.threats_detected || 0} threats detected.`,
      })
      await onRefreshAllData()
      loadGmailMessages()
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
      setStatusMessage({
        type: 'success',
        text: `Email analyzed! Result: ${res.threats_detected > 0 ? '⚠️ Threat Detected' : '✅ Verified Safe'}.`,
      })
      await onRefreshAllData()
      loadGmailMessages()
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Scan failed for this message.' })
    } finally {
      setScanningSelected(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#192837]/10 shadow-xs text-center max-w-2xl mx-auto space-y-6 animate-fade-in font-body">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-600 mx-auto flex items-center justify-center font-bold shadow-md">
          <Mail size={32} />
        </div>
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-[#192837]">
            Gmail Account Not Connected
          </h2>
          <p className="text-xs sm:text-sm text-[#192837]/70 mt-2 leading-relaxed">
            To view, preview, and scan live emails directly from your Gmail inbox, please authorize your Google account in the Profile & Account Settings page.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToProfile}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#7342E2] hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#7342E2]/25 transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Open Profile & Connect Gmail</span>
          <ArrowRight size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in font-body">
      {/* Top Controls Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#192837]/10 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#192837]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7342E2] text-white flex items-center justify-center shadow-md shadow-[#7342E2]/25">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-extrabold text-[#192837]">
                Gmail Ingestion & Threat Scanner
              </h2>
              <p className="text-xs text-[#192837]/60">
                Live Google Workspace mailbox &bull; Connected as: <span className="font-bold text-[#7342E2]">{gmailStatus?.email_address}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadGmailMessages}
              disabled={fetchingMessages}
              className="px-3.5 py-2 rounded-xl bg-[#FAF9F6] hover:bg-[#192837]/5 border border-[#192837]/10 text-xs font-bold text-[#192837] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              <RefreshCw size={14} className={fetchingMessages ? 'animate-spin' : ''} />
              <span>Refresh Mailbox</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToEmails}
              className="px-3.5 py-2 rounded-xl bg-[#7342E2]/10 hover:bg-[#7342E2]/20 text-xs font-bold text-[#7342E2] flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <span>View Analyzed Threats</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {/* Email Count Limit */}
          <div>
            <label className="block text-xs font-bold text-[#192837] mb-1.5 uppercase tracking-wider">
              Batch Scan Range
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 3, 5, 10, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedLimit(num)}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                    selectedLimit === num
                      ? 'bg-[#7342E2] text-white border-[#7342E2] shadow-sm'
                      : 'bg-[#FAF9F6] text-[#192837]/70 border-[#192837]/10 hover:border-[#7342E2]/40'
                  }`}
                >
                  {num}
                </button>
              ))}
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
            <button
              type="button"
              disabled={scanningSelected || selectedMsgIds.length === 0}
              onClick={handleScanSelected}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7342E2] hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#7342E2]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {scanningSelected ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Gemini AI Analyzing ({selectedMsgIds.length})...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Scan Selected ({selectedMsgIds.length} Emails)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 border animate-fade-in ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span className="flex-1">{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages List Card */}
      <div className="bg-white rounded-3xl border border-[#192837]/10 shadow-xs overflow-hidden">
        {/* Table Header / Selection Bar */}
        <div className="px-6 py-4 border-b border-[#192837]/10 bg-[#FAF9F6] flex items-center justify-between gap-4">
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

          <span className="text-xs text-[#192837]/60 font-semibold">
            Showing latest {messages.length} message(s)
          </span>
        </div>

        {fetchingMessages ? (
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
          <div className="divide-y divide-[#192837]/10">
            {messages.map((m) => {
              const isSelected = selectedMsgIds.includes(m.id)
              return (
                <div
                  key={m.id}
                  className={`p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all ${
                    isSelected ? 'bg-[#FAF8FF]' : 'hover:bg-[#FAF9F6]'
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
                      {m.already_scanned ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          <CheckCircle2 size={11} />
                          Already Scanned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                          Pending Scan
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleScanSingle(m.id)}
                        disabled={scanningSelected}
                        className="px-2.5 py-1 rounded-lg bg-[#7342E2]/10 hover:bg-[#7342E2]/20 text-[#7342E2] text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles size={11} />
                        <span>Scan Now</span>
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
