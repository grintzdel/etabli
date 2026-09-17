import { Text } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { StyleSheet, View } from 'react-native'

export type ScreenTitleProps = {
  readonly title: string
  readonly subtitle?: string
}

export const ScreenTitle = ({ title, subtitle }: ScreenTitleProps) => (
  <View style={styles.box}>
    <Text variant="heading">{title}</Text>
    {subtitle === undefined ? null : <Text tone="muted">{subtitle}</Text>}
  </View>
)

const styles = StyleSheet.create({
  box: { gap: spacing[2] },
})
