import { colors, spacing } from '@etabli/ui/tokens'
import type { ReactNode } from 'react'
import { RefreshControl, ScrollView, StyleSheet, useColorScheme, View, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type ScreenProps = {
  readonly children: ReactNode
  readonly onRefresh?: () => void
  readonly refreshing?: boolean
  readonly contentStyle?: ViewStyle
}

export const Screen = ({ children, onRefresh, refreshing = false, contentStyle }: ScreenProps) => {
  const palette = colors[useColorScheme() === 'light' ? 'light' : 'dark']
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      style={{ backgroundColor: palette.graphite[950] }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[16] }, contentStyle]}
      refreshControl={
        onRefresh === undefined ? undefined : (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.graphite[300]} />
        )
      }
    >
      <View style={styles.page}>{children}</View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
  },
  page: { gap: spacing[5] },
})
