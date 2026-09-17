export const text = {
  xs: { size: 12, lineHeight: 16 },
  sm: { size: 14, lineHeight: 20 },
  base: { size: 16, lineHeight: 24 },
  lg: { size: 18, lineHeight: 28 },
  xl: { size: 20, lineHeight: 28 },
  '2xl': { size: 24, lineHeight: 32 },
  '3xl': { size: 30, lineHeight: 36 },
  '4xl': { size: 36, lineHeight: 40 },
} as const

export type TextScale = keyof typeof text

export const tracking = {
  tighter: -0.05,
  tight: -0.025,
  normal: 0,
  wide: 0.025,
  wider: 0.05,
  widest: 0.1,
} as const

export type Tracking = keyof typeof tracking

export const fontWeight = {
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const webFontStack = {
  display: 'var(--font-barlow-condensed), ui-sans-serif, system-ui, sans-serif',
  sans: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
} as const

export const nativeFontFamily = {
  displaySemiBold: 'BarlowCondensed_600SemiBold',
  displayBold: 'BarlowCondensed_700Bold',
  sansRegular: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
} as const

export const letterSpacing = (scale: TextScale, name: Tracking): number => text[scale].size * tracking[name]
