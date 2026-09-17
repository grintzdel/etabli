import type { ReactNode } from 'react'
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native'

import { useColors } from '../theme/use-colors'
import { radii, spacing } from '../tokens'

export type SurfaceProps = {
  readonly children: ReactNode
  readonly style?: StyleProp<ViewStyle>
}

export const Surface = ({ children, style }: SurfaceProps) => {
  const palette = useColors()

  return (
    <View style={[styles.base, { backgroundColor: palette.graphite[900], borderColor: palette.graphite[800] }, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.sm,
    borderWidth: 1,
    padding: spacing[6],
  },
})
