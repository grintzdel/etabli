import { Button, Surface, Text } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { StyleSheet, View } from 'react-native'

export type NoticeProps = {
  readonly title?: string
  readonly message: string
  readonly tone?: 'default' | 'danger'
  readonly actionLabel?: string
  readonly onAction?: () => void
}

export const Notice = ({ title, message, tone = 'default', actionLabel, onAction }: NoticeProps) => (
  <Surface>
    <View style={styles.body}>
      {title === undefined ? null : (
        <Text variant="label" tone={tone === 'danger' ? 'danger' : 'default'}>
          {title}
        </Text>
      )}
      <Text tone="muted">{message}</Text>
      {actionLabel === undefined || onAction === undefined ? null : (
        <Button size="sm" variant="ghost" onPress={onAction}>
          {actionLabel}
        </Button>
      )}
    </View>
  </Surface>
)

const styles = StyleSheet.create({
  body: { alignItems: 'flex-start', gap: spacing[3] },
})
