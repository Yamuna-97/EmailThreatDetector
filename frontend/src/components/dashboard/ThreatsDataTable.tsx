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
          <span className="font-mono font-bold text-[#7342E2]">
            #{row.original.id.slice(0, 8).toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: "threat_type",
        header: "Threat Classification",
        cell: ({ row }) => (
          <div className="max-w-xs space-y-0.5">
            <span className="font-bold text-[#192837] block">
              {row.original.threat_type}
            </span>
            <span className="text-[11px] text-[#192837]/60 line-clamp-1">
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
              ? "bg-red-50 text-red-700 border-red-200"
              : sev === "high"
              ? "bg-orange-50 text-orange-700 border-orange-200"
              : sev === "medium"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"

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
            className="flex items-center gap-1 font-bold hover:text-[#7342E2] cursor-pointer"
          >
            <span>Risk Score</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex items-baseline gap-1 font-mono">
            <span className="font-bold text-red-600">{row.original.risk_score}</span>
            <span className="text-[10px] text-[#192837]/40">/100</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563] border border-gray-200">
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
            className="flex items-center gap-1 font-bold hover:text-[#7342E2] cursor-pointer"
          >
            <span>Detected</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-[#192837]/60 whitespace-nowrap">
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
                className="p-1.5 rounded-xl bg-[#F5F3FF] hover:bg-[#7342E2] hover:text-white text-[#7342E2] border border-[#D8C8FF] transition-all cursor-pointer"
              >
                <Cpu size={13} />
              </button>
            )}

            <button
              type="button"
              onClick={() => onViewForensics(row.original.id)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-[#D8C8FF] font-bold text-xs text-[#192837] hover:border-[#7342E2] hover:text-[#7342E2] transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Eye size={12} />
              <span>Forensics</span>
            </button>

            {onDownloadPdf && (
              <button
                type="button"
                onClick={() => onDownloadPdf(row.original.id)}
                title="Download Incident Dossier"
                className="p-1.5 rounded-xl bg-white hover:bg-[#F5F3FF] text-[#7342E2] border border-[#D8C8FF] transition-all cursor-pointer shadow-2xs"
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
