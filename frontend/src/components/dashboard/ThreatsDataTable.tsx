"use client"

import React, { useMemo } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Eye, Download, Cpu, ArrowUpDown } from "lucide-react"
import { type ThreatItem } from "@/services/threats"

interface ThreatsDataTableProps {
  data: ThreatItem[]
  onViewForensics: (threatId: string) => void
  onDownloadPdf?: (threatId: string) => void
  onOpenCopilot?: (threatId: string) => void
}

export const ThreatsDataTable: React.FC<ThreatsDataTableProps> = ({
  data,
  onViewForensics,
  onDownloadPdf,
  onOpenCopilot,
}) => {
  const columns = useMemo<ColumnDef<ThreatItem>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Threat ID",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-[#FF1E2D]">
            #{row.original.id.slice(0, 8).toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: "threat_type",
        header: "Threat Classification",
        cell: ({ row }) => (
          <div className="max-w-xs space-y-0.5">
            <span className="font-bold text-[#F5F5F5] block">
              {row.original.threat_type}
            </span>
            <span className="text-[11px] text-[#A3A3A3] line-clamp-1">
              {row.original.summary || "AI telemetry detected anomalous pattern."}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ row }) => {
          const sev = row.original.severity
          const colorClass =
            sev === "critical"
              ? "bg-[#FF1E2D]/10 text-[#FF1E2D] border-[#FF1E2D]/30"
              : sev === "high"
              ? "bg-[#FF5A36]/10 text-[#FF5A36] border-[#FF5A36]/30"
              : sev === "medium"
              ? "bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"

          return (
            <span className={`px-2 py-0.5 rounded-md font-extrabold uppercase text-[10px] border ${colorClass}`}>
              {sev}
            </span>
          )
        },
      },
      {
        accessorKey: "risk_score",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 font-bold hover:text-[#FF1E2D] cursor-pointer"
          >
            <span>Risk Score</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex items-baseline gap-1 font-mono">
            <span className="font-bold text-[#FF1E2D]">{row.original.risk_score}</span>
            <span className="text-[10px] text-[#737373]">/100</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-[#181818] text-[#A3A3A3] border border-[#2A2A2A]">
            {row.original.status || "active"}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 font-bold hover:text-[#FF1E2D] cursor-pointer"
          >
            <span>Detected</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-[#737373] whitespace-nowrap">
            {new Date(row.original.created_at).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {onOpenCopilot && (
              <button
                type="button"
                onClick={() => onOpenCopilot(row.original.email_id || row.original.id)}
                title="Open AI Copilot"
                className="p-1.5 rounded-xl bg-[#181818] hover:bg-[#FF1E2D] hover:text-white text-[#FF1E2D] border border-[#2A2A2A] transition-all cursor-pointer"
              >
                <Cpu size={13} />
              </button>
            )}

            <button
              type="button"
              onClick={() => onViewForensics(row.original.id)}
              className="px-2.5 py-1.5 rounded-xl bg-[#181818] border border-[#2A2A2A] font-bold text-xs text-[#F5F5F5] hover:border-[#FF1E2D] hover:text-[#FF1E2D] transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Eye size={12} />
              <span>Forensics</span>
            </button>

            {onDownloadPdf && (
              <button
                type="button"
                onClick={() => onDownloadPdf(row.original.id)}
                title="Download Incident Dossier"
                className="p-1.5 rounded-xl bg-[#181818] hover:bg-[#FF1E2D]/20 text-[#FF1E2D] border border-[#2A2A2A] transition-all cursor-pointer shadow-2xs"
              >
                <Download size={13} />
              </button>
            )}
          </div>
        ),
      },
    ],
    [onViewForensics, onDownloadPdf, onOpenCopilot]
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="threat_type"
      searchPlaceholder="Filter threat types or summaries..."
      onRowClick={(row) => onViewForensics(row.id)}
    />
  )
}
export default ThreatsDataTable
