import { StatusBadge, Surface, Text } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { Pressable, StyleSheet, View } from 'react-native'

import { formatDistance, MACHINE_KIND_LABELS, type AtelierSummary } from '../../core/model/atelier'

export type AtelierCardProps = {
  readonly atelier: AtelierSummary
  readonly onPress: (slug: string) => void
}

export const AtelierCard = ({ atelier, onPress }: AtelierCardProps) => (
  <Pressable accessibilityRole="button" onPress={() => onPress(atelier.slug)}>
    <Surface>
      <View style={styles.body}>
        <View style={styles.header}>
          <Text variant="label">{atelier.name}</Text>
          {atelier.distanceKm === null ? null : (
            <Text variant="caption" tone="accent">
              {formatDistance(atelier.distanceKm)}
            </Text>
          )}
        </View>
        <Text tone="muted">{atelier.city}</Text>
        <View style={styles.kinds}>
          <StatusBadge label={`${atelier.machineCount} machine${atelier.machineCount > 1 ? 's' : ''}`} />
          {atelier.machineKinds.map((kind) => (
            <StatusBadge key={kind} label={MACHINE_KIND_LABELS[kind]} />
          ))}
        </View>
      </View>
    </Surface>
  </Pressable>
)

const styles = StyleSheet.create({
  body: { gap: spacing[3] },
  header: { alignItems: 'baseline', flexDirection: 'row', gap: spacing[3], justifyContent: 'space-between' },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
})
