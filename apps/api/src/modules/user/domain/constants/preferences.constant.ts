export const Theme = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system',
} as const
export type Theme = (typeof Theme)[keyof typeof Theme]

export const THEMES = [Theme.DARK, Theme.LIGHT, Theme.SYSTEM] as const

export const DEFAULT_THEME: Theme = Theme.SYSTEM
