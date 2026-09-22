import { StatusBadge, Surface, Text } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { Pressable, StyleSheet, View } from 'react-native'

import type { MemberAtelier } from '../../core/model/session'

const ROLE_LABELS: Readonly<Record<MemberAtelier['role'], string>> = {
  MEMBER: 'Membre',
  FABMANAGER: 'Fabmanager',
}

export type MembershipListProps = {
  readonly ateliers: ReadonlyArray<MemberAtelier>
  readonly onSelect: (slug: string) => void
}

export const MembershipList = ({ ateliers, onSelect }: MembershipListProps) => (
  <View style={styles.list}>
    {ateliers.map((atelier) => (
      <Pressable key={atelier.id} accessibilityRole="button" onPress={() => onSelect(atelier.slug)}>
        <Surface>
          <View style={styles.row}>
            <Text variant="label">{atelier.name}</Text>
            <StatusBadge label={ROLE_LABELS[atelier.role]} />
          </View>
        </Surface>
      </Pressable>
    ))}
  </View>
)

const styles = StyleSheet.create({
  list: { gap: spacing[3] },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing[3], justifyContent: 'space-between' },
})
