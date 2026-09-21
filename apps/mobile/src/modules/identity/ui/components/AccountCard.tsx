import { StatusBadge, Surface, Text } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { StyleSheet, View } from 'react-native'

import type { CurrentUser } from '../../core/model/session'

export type AccountCardProps = {
  readonly user: CurrentUser
}

export const AccountCard = ({ user }: AccountCardProps) => (
  <Surface>
    <View style={styles.body}>
      <Text variant="label">{user.displayName}</Text>
      <Text tone="muted">{user.email}</Text>
      <View style={styles.badges}>
        <StatusBadge label={`${user.memberships.length} atelier${user.memberships.length > 1 ? 's' : ''}`} />
        {user.practice.map((practice) => (
          <StatusBadge key={practice} label={practice} />
        ))}
      </View>
    </View>
  </Surface>
)

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  body: { gap: spacing[3] },
})
