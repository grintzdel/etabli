export const colors = {
  dark: {
    graphite: {
      950: '#0b0c0e',
      900: '#131518',
      800: '#1c1f24',
      700: '#2a2e35',
      600: '#3d434c',
      500: '#5c636c',
      400: '#7b828d',
      300: '#9fa5af',
      200: '#c3c8d0',
      100: '#dcdfe4',
      50: '#f4f6f8',
    },
    signal: { 600: '#d14f00', 500: '#ff6a00', 400: '#ff8534' },
    status: { ok: '#3fbf6f', warn: '#f5a524', danger: '#e5484d' },
  },
  // The graphite ramp is semantic, not literal — 950 is the ground and 50 is the ink — so the light
  // scheme swaps the rungs instead of recolouring every utility that names them.
  light: {
    graphite: {
      950: '#f4f6f8',
      900: '#e9ecf0',
      800: '#dcdfe4',
      700: '#c3c8d0',
      600: '#9fa5af',
      500: '#7b828d',
      400: '#5c636c',
      300: '#3d434c',
      200: '#2a2e35',
      100: '#1c1f24',
      50: '#131518',
    },
    signal: { 600: '#7a2e00', 500: '#a33d00', 400: '#d14f00' },
    status: { ok: '#1a7040', warn: '#7c5200', danger: '#b0272c' },
  },
} as const

export type ColorScheme = keyof typeof colors
export type Palette = (typeof colors)[ColorScheme]

export const withAlpha = (hex: string, alpha: number): string => {
  const channel = (start: number) => Number.parseInt(hex.slice(start, start + 2), 16)

  return `rgba(${channel(1)}, ${channel(3)}, ${channel(5)}, ${alpha})`
}
