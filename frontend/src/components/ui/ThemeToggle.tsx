import React, { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Laptop, Check } from 'lucide-react'
import { useTheme, type Theme } from '../../context/ThemeContext'

interface ThemeToggleProps {
  variant?: 'dropdown' | 'segmented' | 'cycle'
  className?: string
  showLabel?: boolean
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'dropdown',
  className = '',
  showLabel = false,
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Cycle mode: clicks rotate through dark -> light -> system
  const handleCycle = () => {
    if (theme === 'dark') setTheme('light')
    else if (theme === 'light') setTheme('system')
    else setTheme('dark')
  }

  const options: { id: Theme; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: 'Light', icon: <Sun size={15} /> },
    { id: 'dark', label: 'Dark', icon: <Moon size={15} /> },
    { id: 'system', label: 'System', icon: <Laptop size={15} /> },
  ]

  if (variant === 'cycle') {
    return (
      <button
        type="button"
        onClick={handleCycle}
        title={`Current theme: ${theme} (Click to toggle)`}
        aria-label="Toggle color theme"
        className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-interactive)] border border-[var(--border-primary)] hover:border-[#FF1E2D]/40 text-[var(--color-text-primary)] hover:text-[#FF1E2D] transition-all cursor-pointer shadow-sm ${className}`}
      >
        {resolvedTheme === 'dark' ? (
          <Moon size={17} className="text-[#FF1E2D]" />
        ) : (
          <Sun size={17} className="text-amber-500" />
        )}
      </button>
    )
  }

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-[var(--surface-card)] border border-[var(--border-primary)] shadow-inner ${className}`}
      >
        {options.map((opt) => {
          const isActive = theme === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/30'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--surface-raised)]'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // Default: Dropdown Popover
  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`Theme: ${theme.toUpperCase()} (Click to change)`}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-interactive)] border border-[var(--border-primary)] hover:border-[#FF1E2D]/40 text-[var(--color-text-primary)] text-xs font-semibold transition-all cursor-pointer shadow-sm"
      >
        {theme === 'dark' ? (
          <Moon size={15} className="text-[#FF1E2D]" />
        ) : theme === 'light' ? (
          <Sun size={15} className="text-amber-500" />
        ) : (
          <Laptop size={15} className="text-[#FF1E2D]" />
        )}

        {showLabel && (
          <span className="capitalize font-mono font-bold text-[11px] text-[var(--color-text-muted)]">
            {theme}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-2xl p-1.5 z-50 animate-fade-in font-body">
          <div className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-wider px-2 py-1 mb-0.5">
            Select Theme
          </div>
          {options.map((opt) => {
            const isActive = theme === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E50914] text-white shadow-sm'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--surface-raised)] hover:text-[#FF1E2D]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isActive && <Check size={13} className="text-white" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ThemeToggle
