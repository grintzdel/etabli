import { colors, spacing } from '@etabli/ui/tokens'
import type { ReactNode } from 'react'
import { RefreshControl, ScrollView, StyleSheet, useColorScheme, View, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type ScreenProps = {
  readonly children: ReactNode
  readonly onRefresh?: () => void
  readonly refreshing?: boolean
  readonly contentStyle?: ViewStyle
  readonly footer?: ReactNode
}

export const Screen = ({ children, onRefresh, refreshing = false, contentStyle, footer }: ScreenProps) => {
  const palette = colors[useColorScheme() === 'light' ? 'light' : 'dark']
  const insets = useSafeAreaInsets()

  const scroll = (
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

  if (footer === undefined || footer === null) return scroll

  return (
    <View style={[styles.fill, { backgroundColor: palette.graphite[950] }]}>
      {scroll}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: palette.graphite[900],
            borderTopColor: palette.graphite[800],
            paddingBottom: insets.bottom + spacing[3],
          },
        ]}
      >
        {footer}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
  },
  fill: { flex: 1 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing[5], paddingTop: spacing[3] },
  page: { gap: spacing[5] },
})
