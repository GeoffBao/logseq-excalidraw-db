import { useState, useEffect, useCallback } from 'react'
import type { Theme } from '../types'
import { logger } from '../lib/logger'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    // Get initial theme from Logseq
    const getTheme = async () => {
      try {
        // Try multiple methods to detect theme
        const settings = await logseq.App.getUserConfigs()
        logger.debug('User configs:', settings)

        // Check preferredThemeMode first
        if (settings.preferredThemeMode) {
          const mode = settings.preferredThemeMode
          setTheme(mode === 'dark' ? 'dark' : 'light')
          logger.debug('Theme from preferredThemeMode:', mode)
          return
        }

        // Try to detect from DOM (Logseq adds theme class to html/body)
        const htmlTheme = document.documentElement.getAttribute('data-theme')
        const bodyClass = document.body.classList

        if (htmlTheme === 'dark' || bodyClass.contains('dark-theme') || bodyClass.contains('dark')) {
          setTheme('dark')
          logger.debug('Theme from DOM: dark')
          return
        }

        if (htmlTheme === 'light' || bodyClass.contains('light-theme') || bodyClass.contains('white')) {
          setTheme('light')
          logger.debug('Theme from DOM: light')
          return
        }

        // Check parent window (plugin runs in iframe)
        try {
          const parentTheme = window.parent?.document?.documentElement?.getAttribute('data-theme')
          if (parentTheme) {
            setTheme(parentTheme === 'dark' ? 'dark' : 'light')
            logger.debug('Theme from parent:', parentTheme)
            return
          }
        } catch (e) {
          // Cross-origin access denied
        }

        // Fallback to system preference
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setTheme(isDark ? 'dark' : 'light')
        logger.debug('Theme from system:', isDark ? 'dark' : 'light')
      } catch (error) {
        logger.error('Theme detection error:', error)
        // Fallback to system preference
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setTheme(isDark ? 'dark' : 'light')
      }
    }

    getTheme()

    // Listen for theme changes from Logseq
    const unsubscribe = logseq.App.onThemeModeChanged(({ mode }: { mode: 'dark' | 'light' }) => {
      logger.debug('Theme changed:', mode)
      setTheme(mode === 'dark' ? 'dark' : 'light')
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return { theme, setTheme, toggleTheme }
}
