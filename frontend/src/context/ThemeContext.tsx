import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light' | 'system'
export type ResolvedTheme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'cybertrace_theme'

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
    return 'dark'
  })

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')

  useEffect(() => {
    const root = document.documentElement

    const updateResolvedTheme = () => {
      let resolved: ResolvedTheme = 'dark'
      if (theme === 'system') {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        resolved = isSystemDark ? 'dark' : 'light'
      } else {
        resolved = theme
      }

      setResolvedTheme(resolved)

      // Apply classes and data attribute to html
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
      root.setAttribute('data-theme', resolved)
      root.style.colorScheme = resolved
    }

    updateResolvedTheme()
    localStorage.setItem(THEME_STORAGE_KEY, theme)

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => updateResolvedTheme()
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    }
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
