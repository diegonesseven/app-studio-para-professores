import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { appSettingsService, DEFAULT_APPEARANCE } from '@/services/appSettings'
import type { AppAppearanceSettings } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'

interface ThemeContextType {
  appearance: AppAppearanceSettings
  isLoading: boolean
  updateAppearance: (
    newSettings: Partial<AppAppearanceSettings>,
    fileToUpload?: File | null,
    removeLogoFile?: boolean,
  ) => Promise<void>
  resetAppearance: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Converte hex (ex: #8B5CF6) em HSL (h s% l%) para alimentar as variáveis Tailwind Shadcn.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number; string: string } | null {
  let c = hex.replace('#', '').trim()
  if (c.length === 3) {
    c = c
      .split('')
      .map((x) => x + x)
      .join('')
  }
  if (c.length !== 6) return null

  const r = parseInt(c.substring(0, 2), 16) / 255
  const g = parseInt(c.substring(2, 4), 16) / 255
  const b = parseInt(c.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h = Math.round(h * 60)
  }

  const sPct = Math.round(s * 100)
  const lPct = Math.round(l * 100)
  return {
    h,
    s: sPct,
    l: lPct,
    string: `${h} ${sPct}% ${lPct}%`,
  }
}

/**
 * Aplica as propriedades no :root para que Tailwind, botões, bordas e superfícies
 * respondam instantaneamente em toda a aplicação.
 */
function applyThemeToDocument(appearance: AppAppearanceSettings) {
  const root = document.documentElement
  const primaryHsl = hexToHsl(appearance.primary_color)
  const bgHsl = hexToHsl(appearance.background_color)
  const surfaceHsl = hexToHsl(appearance.surface_color)

  if (primaryHsl) {
    root.style.setProperty('--primary', primaryHsl.string)
    root.style.setProperty('--accent', primaryHsl.string)
    root.style.setProperty('--ring', primaryHsl.string)
    root.style.setProperty('--sidebar-primary', primaryHsl.string)
    root.style.setProperty('--sidebar-ring', primaryHsl.string)
    root.style.setProperty('--app-primary', appearance.primary_color)
  }

  if (bgHsl) {
    root.style.setProperty('--background', bgHsl.string)
    root.style.setProperty('--sidebar-background', bgHsl.string)
    root.style.setProperty('--app-bg', appearance.background_color)

    // Ajusta o foreground (texto principal) de acordo com o brilho do fundo
    const isBgDark = bgHsl.l < 50
    const textFg = isBgDark ? '0 0% 100%' : '222 47% 11%'
    const mutedFg = isBgDark ? '250 16% 70%' : '215 16% 47%'
    const borderCol = isBgDark ? '246 18% 22%' : '214 32% 91%'
    root.style.setProperty('--foreground', textFg)
    root.style.setProperty('--muted-foreground', mutedFg)
    root.style.setProperty('--border', borderCol)
    root.style.setProperty('--input', borderCol)
    root.style.setProperty('--sidebar-foreground', textFg)
    root.style.setProperty('--sidebar-border', borderCol)
  }

  if (surfaceHsl) {
    root.style.setProperty('--card', surfaceHsl.string)
    root.style.setProperty('--popover', surfaceHsl.string)
    root.style.setProperty('--app-surface', appearance.surface_color)

    const isSurfaceDark = surfaceHsl.l < 50
    const cardFg = isSurfaceDark ? '0 0% 100%' : '222 47% 11%'
    root.style.setProperty('--card-foreground', cardFg)
    root.style.setProperty('--popover-foreground', cardFg)
  }

  // Define se o texto de contraste da cor primária deve ser branco ou escuro
  if (primaryHsl) {
    const isBright = primaryHsl.l > 65
    const fg = isBright ? '222 47% 11%' : '0 0% 100%'
    root.style.setProperty('--primary-foreground', fg)
    root.style.setProperty('--accent-foreground', fg)
    root.style.setProperty('--sidebar-primary-foreground', fg)
  }

  // Sincroniza meta tags PWA nativas do navegador
  try {
    // 1. theme-color
    let metaTheme = document.querySelector('meta[name="theme-color"]')
    if (!metaTheme) {
      metaTheme = document.createElement('meta')
      metaTheme.setAttribute('name', 'theme-color')
      document.head.appendChild(metaTheme)
    }
    metaTheme.setAttribute('content', appearance.primary_color || '#8B5CF6')

    // 2. Title do documento
    if (appearance.studio_name) {
      document.title = appearance.studio_name
    }

    // 3. Ícone dinâmico do app se customizado pelo admin
    if (appearance.logo_url) {
      const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]')
      if (appleTouchIcon) {
        appleTouchIcon.setAttribute('href', appearance.logo_url)
      }
      const iconLink = document.querySelector('link[rel="icon"]')
      if (iconLink) {
        iconLink.setAttribute('href', appearance.logo_url)
      }
    } else {
      const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]')
      if (appleTouchIcon) {
        appleTouchIcon.setAttribute('href', '/icon.svg')
      }
      const iconLink = document.querySelector('link[rel="icon"]')
      if (iconLink) {
        iconLink.setAttribute('href', '/icon.svg')
      }
    }
  } catch (_) {
    // Ignora erros caso o ambiente não seja o DOM
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appearance, setAppearance] = useState<AppAppearanceSettings>(DEFAULT_APPEARANCE)
  const [isLoading, setIsLoading] = useState(true)

  // Carrega configurações salvas do backend
  const loadAppearance = useCallback(async () => {
    try {
      const data = await appSettingsService.getAppearance()
      setAppearance(data)
      applyThemeToDocument(data)
    } catch (err) {
      console.error('Falha ao carregar tema:', err)
      applyThemeToDocument(DEFAULT_APPEARANCE)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAppearance()
  }, [loadAppearance])

  // Sincronização em tempo real (qualquer outro dispositivo que alterar tema atualiza aqui na hora)
  useRealtime<AppAppearanceSettings>('app_settings', async (e) => {
    if (e.record && e.record.key === 'appearance') {
      // Recarrega via service para resolver getURL caso tenha logo_file
      try {
        const fresh = await appSettingsService.getAppearance()
        setAppearance(fresh)
        applyThemeToDocument(fresh)
      } catch (_) {
        const updated: AppAppearanceSettings = {
          ...DEFAULT_APPEARANCE,
          ...e.record,
        }
        setAppearance(updated)
        applyThemeToDocument(updated)
      }
    }
  })

  const updateAppearance = async (
    newSettings: Partial<AppAppearanceSettings>,
    fileToUpload?: File | null,
    removeLogoFile?: boolean,
  ) => {
    const updated = await appSettingsService.saveAppearance(
      {
        ...appearance,
        ...newSettings,
      },
      fileToUpload,
      removeLogoFile,
    )
    setAppearance(updated)
    applyThemeToDocument(updated)
  }

  const resetAppearance = async () => {
    const res = await appSettingsService.resetAppearance()
    setAppearance(res)
    applyThemeToDocument(res)
  }

  return (
    <ThemeContext.Provider
      value={{
        appearance,
        isLoading,
        updateAppearance,
        resetAppearance,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider')
  }
  return context
}
