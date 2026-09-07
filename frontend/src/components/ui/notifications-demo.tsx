import NotificationsWithActions from "@/components/ui/notifications-with-actions"
import { useNotifications } from "@/context/NotificationContext"
import { ShieldAlert, FileText, CheckCircle2, Link2, Unlink } from "lucide-react"

export default function DemoOne() {
  return <NotificationsWithActions />
}

export function NotificationControlsDemo() {
  const {
    notifications,
    notifyThreatIdentified,
    notifyInvestigationSubmitted,
    notifyInvestigationCompleted,
    notifyGoogleConnected,
    notifyGoogleDisconnected,
    notifyInvestigatorNewReport,
    removeNotification,
    archiveNotification,
  } = useNotifications()

  return (
    <div className="p-6 max-w-xl bg-white rounded-2xl border border-[#192837]/10 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-base font-bold text-[#192837]">
            CyberTrace Security Notifications
          </h3>
          <p className="text-xs text-[#192837]/60">
            Real-time 60s automatic updates & event triggers
          </p>
        </div>
        <NotificationsWithActions
          items={notifications}
          onDelete={removeNotification}
          onArchive={archiveNotification}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          type="button"
          onClick={() => notifyThreatIdentified("Credential Phishing", "attacker@evil-domain.com", 94)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer text-left"
        >
          <ShieldAlert size={14} className="shrink-0" />
          <span>Threat Message</span>
        </button>

        <button
          type="button"
          onClick={() => notifyInvestigationSubmitted("INV-9821", "Urgent Wire Transfer Phish")}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition cursor-pointer text-left"
        >
          <FileText size={14} className="shrink-0" />
          <span>Report Investigation</span>
        </button>

        <button
          type="button"
          onClick={() => notifyInvestigationCompleted("INV-9821", "Resolved & Mitigated")}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer text-left"
        >
          <CheckCircle2 size={14} className="shrink-0" />
          <span>Investigation Done</span>
        </button>

        <button
          type="button"
          onClick={() => notifyInvestigatorNewReport("REP-4190", "ceo-office@company.com", "Executive Impersonation")}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer text-left"
        >
          <ShieldAlert size={14} className="shrink-0" />
          <span>Investigator Alert</span>
        </button>

        <button
          type="button"
          onClick={() => notifyGoogleConnected("security@cybertrace.io")}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer text-left"
        >
          <Link2 size={14} className="shrink-0" />
          <span>Google Connected</span>
        </button>

        <button
          type="button"
          onClick={() => notifyGoogleDisconnected()}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition cursor-pointer text-left"
        >
          <Unlink size={14} className="shrink-0" />
          <span>Google Disconnected</span>
        </button>
      </div>
    </div>
  )
}
