"use client";

import * as React from "react"
import { Bell, GripVertical, Trash2, Archive, ChevronRight } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  type?: 'threat' | 'investigation' | 'system' | 'google' | 'report'
}

export interface NotificationsWithActionsProps {
  items?: NotificationItem[]
  placement?: "top" | "right" | "bottom" | "left"
  onDelete?: (id: string) => void
  onArchive?: (id: string) => void
  onItemClick?: (item: NotificationItem) => void
}

export default function NotificationsWithActions({
  items = [],
  placement = "bottom",
  onDelete,
  onArchive,
  onItemClick,
}: NotificationsWithActionsProps) {
  const [notifications, setNotifications] =
    React.useState<NotificationItem[]>(items)
  const [activeId, setActiveId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setNotifications(items)
  }, [items])

  const handleArchive = (id?: string) => {
    const targetId = id || activeId
    if (targetId) {
      if (onArchive) onArchive(targetId)
      setNotifications((prev) => prev.filter((n) => n.id !== targetId))
    }
    setActiveId(null)
  }

  const handleDelete = (id: string) => {
    if (onDelete) onDelete(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setActiveId(null)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          type="button"
          aria-label="View notifications"
          className="relative inline-flex items-center justify-center rounded-full p-2 text-[#F5F5F5] hover:bg-[#181818] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF1E2D]/40"
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge
              variant="default"
              className="absolute -top-1 -right-1 text-[10px] h-4 min-w-4 px-1 py-0 flex items-center justify-center bg-[#E50914] hover:bg-[#FF1E2D] text-white font-bold rounded-full shadow-sm animate-pulse"
            >
              {notifications.length}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-84 sm:w-96 p-0 rounded-2xl shadow-2xl border border-[#2A2A2A] bg-[#0A0A0A] overflow-hidden z-50 text-[#F5F5F5]"
        align="end"
        side={placement}
      >
        <div className="px-4 py-3 bg-[#111111] border-b border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading text-xs font-black text-[#F5F5F5] uppercase tracking-wider">
              Alerts & Notifications
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#FF1E2D]/15 text-[#FF1E2D] border border-[#FF1E2D]/30 text-[10px] font-mono font-bold">
              {notifications.length} new
            </span>
          </div>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => setNotifications([])}
              className="text-[11px] font-mono text-[#FF1E2D] hover:text-white transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
        <Card className="max-h-88 overflow-y-auto rounded-none border-none shadow-none bg-[#0A0A0A]">
          {notifications.length === 0 ? (
            <div className="p-8 text-sm text-[#737373] text-center flex flex-col items-center justify-center gap-2">
              <Bell className="h-8 w-8 text-[#444444]" />
              <p className="font-semibold text-xs text-[#F5F5F5]">No new alerts</p>
              <p className="text-[11px] text-[#737373]">Threat detection pipeline is actively monitoring</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#1F1F1F]">
              {notifications.map((item) => {
                const isActive = activeId === item.id
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between p-3.5 hover:bg-[#181818] transition-colors cursor-pointer"
                    onClick={() => onItemClick && onItemClick(item)}
                  >
                    {/* Left text with animation */}
                    <motion.div
                      animate={{ x: isActive ? -36 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 min-w-0 pr-2"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-xs text-[#F5F5F5] truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-[#737373] shrink-0 ml-2 font-medium">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A3A3A3] line-clamp-2 leading-relaxed font-body">
                        {item.description}
                      </p>
                    </motion.div>

                    {/* Right side controls */}
                    <div className="ml-1 flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isActive ? (
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            title="Archive"
                            className="p-1 rounded-md hover:bg-[#2A2A2A] text-[#737373] hover:text-[#F5F5F5] transition cursor-pointer"
                            onClick={() => handleArchive(item.id)}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            className="p-1 rounded-md hover:bg-[#FF1E2D]/20 text-[#FF1E2D] transition cursor-pointer"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Close"
                            className="p-1 rounded-md hover:bg-[#2A2A2A] text-[#737373] hover:text-[#F5F5F5] transition cursor-pointer"
                            onClick={() => setActiveId(null)}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          title="Actions"
                          className="p-1.5 rounded-md hover:bg-[#181818] text-[#555555] hover:text-[#F5F5F5] transition cursor-pointer"
                          onClick={() =>
                            setActiveId(isActive ? null : item.id)
                          }
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  )
}
