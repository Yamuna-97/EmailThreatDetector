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

const defaultNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Welcome 🎉",
    description: "Thanks for checking out the notifications component!",
    time: "just now",
  },
  {
    id: "2",
    title: "System Update",
    description: "We’ve rolled out a new feature for you.",
    time: "1h ago",
  },
  {
    id: "3",
    title: "Reminder",
    description: "Don’t forget to finish your profile setup.",
    time: "3h ago",
  },
]

export default function NotificationsWithActions({
  items = defaultNotifications,
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
          className="relative inline-flex items-center justify-center rounded-full p-2 text-[#192837] hover:bg-[#192837]/5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7342E2]/30"
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge
              variant="default"
              className="absolute -top-1 -right-1 text-[10px] h-4 min-w-4 px-1 py-0 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-sm animate-pulse"
            >
              {notifications.length}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-84 sm:w-96 p-0 rounded-2xl shadow-xl border border-[#192837]/10 bg-white overflow-hidden z-50"
        align="end"
        side={placement}
      >
        <div className="px-4 py-3 bg-[#FAF9F6] border-b border-[#192837]/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading text-xs font-extrabold text-[#192837] uppercase tracking-wider">
              Alerts & Notifications
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#7342E2]/10 text-[#7342E2] text-[10px] font-bold">
              {notifications.length} new
            </span>
          </div>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => setNotifications([])}
              className="text-[11px] font-semibold text-[#7342E2] hover:underline cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
        <Card className="max-h-88 overflow-y-auto rounded-none border-none shadow-none bg-white">
          {notifications.length === 0 ? (
            <div className="p-8 text-sm text-[#192837]/60 text-center flex flex-col items-center justify-center gap-2">
              <Bell className="h-8 w-8 text-[#192837]/20" />
              <p className="font-semibold text-xs text-[#192837]/70">No new notifications</p>
              <p className="text-[11px] text-[#192837]/40">You're all caught up with recent alerts</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#192837]/5">
              {notifications.map((item) => {
                const isActive = activeId === item.id
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between p-3.5 hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                    onClick={() => onItemClick && onItemClick(item)}
                  >
                    {/* Left text with animation */}
                    <motion.div
                      animate={{ x: isActive ? -36 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 min-w-0 pr-2"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-xs text-[#192837] truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-[#192837]/50 shrink-0 ml-2 font-medium">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#192837]/70 line-clamp-2 leading-relaxed">
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
                            className="p-1 rounded-md hover:bg-[#192837]/10 text-[#192837]/60 hover:text-[#192837] transition cursor-pointer"
                            onClick={() => handleArchive(item.id)}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            className="p-1 rounded-md hover:bg-red-50 text-red-600 transition cursor-pointer"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Close"
                            className="p-1 rounded-md hover:bg-[#192837]/10 text-[#192837]/60 hover:text-[#192837] transition cursor-pointer"
                            onClick={() => setActiveId(null)}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          title="Actions"
                          className="p-1.5 rounded-md hover:bg-[#192837]/5 text-[#192837]/40 hover:text-[#192837] transition cursor-pointer"
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
