import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native'

import { useColors } from '../theme/use-colors'
import { letterSpacing, nativeFontFamily, radii, spacing, text, withAlpha } from '../tokens'
import type { StatusBadgeOwnProps, StatusTone } from './status-badge.types'

export type StatusBadgeProps = StatusBadgeOwnProps & {
  readonly style?: StyleProp<ViewStyle>
}

export const StatusBadge = ({ tone = 'neutral', label, style }: StatusBadgeProps) => {
  const palette = useColors()

  const skin: Record<StatusTone, { readonly background: string; readonly border: string; readonly ink: string }> = {
    ok: {
      background: withAlpha(palette.status.ok, 0.1),
      border: withAlpha(palette.status.ok, 0.4),
      ink: palette.status.ok,
    },
    warn: {
      background: withAlpha(palette.status.warn, 0.1),
      border: withAlpha(palette.status.warn, 0.4),
      ink: palette.status.warn,
    },
    danger: {
      background: withAlpha(palette.status.danger, 0.1),
      border: withAlpha(palette.status.danger, 0.4),
      ink: palette.status.danger,
    },
    neutral: {
      background: palette.graphite[800],
      border: palette.graphite[700],
      ink: palette.graphite[200],
    },
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.base, { backgroundColor: skin[tone].background, borderColor: skin[tone].border }, style]}
    >
      <Text style={[styles.label, { color: skin[tone].ink }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
  },
  label: {
    fontFamily: nativeFontFamily.displaySemiBold,
    fontSize: text.xs.size,
    letterSpacing: letterSpacing('xs', 'wider'),
    lineHeight: text.xs.lineHeight,
    textTransform: 'uppercase',
  },
})
