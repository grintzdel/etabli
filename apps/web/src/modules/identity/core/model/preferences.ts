import type { MemberAtelier, Theme, UpdatePreferencesInput, UserPreferences } from '@etabli/contract'

export type { MemberAtelier, Theme, UpdatePreferencesInput, UserPreferences }

export const DEFAULT_THEME: Theme = 'system'

export const THEME_OPTIONS: ReadonlyArray<{ readonly value: Theme; readonly label: string; readonly hint: string }> = [
  { value: 'system', label: 'Système', hint: "Suit le réglage de l'appareil" },
  { value: 'dark', label: 'Sombre', hint: "La direction artistique d'Établi" },
  { value: 'light', label: 'Clair', hint: 'Pour les ateliers très éclairés' },
]

export const isTheme = (candidate: unknown): candidate is Theme =>
  candidate === 'dark' || candidate === 'light' || candidate === 'system'
