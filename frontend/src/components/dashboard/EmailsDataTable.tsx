"use client"

import React, { useMemo } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { ShieldAlert, CheckCircle2, ArrowUpDown, Eye } from "lucide-react"
import { type EmailItem, type ThreatItem } from "@/services/threats"

interface EmailsDataTableProps {
  emails: EmailItem[]
  threats: ThreatItem[]
  onSelectEmail: (email: EmailItem) => void
  selectedEmailId?: string | null
}

export const EmailsDataTable: React.FC<EmailsDataTableProps> = ({
  emails,
  threats,
  onSelectEmail,
  selectedEmailId,
}) => {
  const columns = useMemo<ColumnDef<EmailItem>[]>(
    () => [
      {
        accessorKey: "sender",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 font-bold hover:text-[#7342E2] cursor-pointer"
          >
            <span>Sender</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate space-y-0.5">
            <span className="font-bold text-[#192837] block truncate">
              {row.original.sender || "Unknown Sender"}
            </span>
            <span className="text-[11px] font-mono text-[#192837]/50 block truncate">
              {row.original.headers?.from_header || ""}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "subject",
        header: "Subject & Message Snippet",
        cell: ({ row }) => (
          <div className="max-w-md space-y-0.5">
            <span className="font-bold text-[#192837] block line-clamp-1">
              {row.original.subject || "(No Subject)"}
            </span>
            <p className="text-[11px] text-[#192837]/60 line-clamp-1 font-body">
              {row.original.snippet || row.original.plain_text_body || "No preview available"}
            </p>
          </div>
        ),
      },
      {
        id: "threat_status",
        header: "Threat Verdict",
        cell: ({ row }) => {
          const matchingThreat = threats.find((t) => t.email_id === row.original.id)
          if (!matchingThreat) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 size={11} className="text-emerald-600" />
                CLEAN / BENIGN
              </span>
            )
          }

          const sevColor =
            matchingThreat.severity === "critical"
              ? "bg-red-50 text-red-700 border-red-200"
              : matchingThreat.severity === "high"
              ? "bg-orange-50 text-orange-700 border-orange-200"
              : matchingThreat.severity === "medium"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"

          return (
            <div className="flex flex-col gap-0.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border w-fit ${sevColor}`}>
                <ShieldAlert size={10} />
                {matchingThreat.severity}
              </span>
              <span className="text-[10px] font-mono font-bold text-red-600">
                Score: {matchingThreat.risk_score}/100
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 font-bold hover:text-[#7342E2] cursor-pointer"
          >
            <span>Received</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const date = row.original.date
            ? new Date(row.original.date).toLocaleDateString()
            : "Recent"
          return <span className="text-xs text-[#192837]/60 whitespace-nowrap">{date}</span>
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const isSelected = selectedEmailId === row.original.id
          return (
            <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onSelectEmail(row.original)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                  isSelected
                    ? "bg-[#7342E2] text-white"
                    : "bg-white border border-[#192837]/15 text-[#192837] hover:border-[#7342E2] hover:text-[#7342E2]"
                }`}
              >
                <Eye size={12} />
                <span>{isSelected ? "Inspecting" : "Inspect"}</span>
              </button>
            </div>
          )
        },
      },
    ],
    [threats, onSelectEmail, selectedEmailId]
  )

  return (
    <DataTable
      columns={columns}
      data={emails}
      searchKey="subject"
      searchPlaceholder="Search message subjects or senders..."
      onRowClick={(row) => onSelectEmail(row)}
    />
  )
}
