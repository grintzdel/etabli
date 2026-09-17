import { StatusBadge, Surface, Text } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { Pressable, StyleSheet, View } from 'react-native'

import { Notice } from '../../../shared/ui/components/Notice'
import {
  MACHINE_KIND_LABELS,
  MACHINE_STATUS_LABELS,
  MACHINE_STATUS_TONES,
  type PublicMachine,
} from '../../core/model/atelier'

export type MachineListProps = {
  readonly machines: ReadonlyArray<PublicMachine>
  readonly onSelect: (id: string) => void
}

export const MachineList = ({ machines, onSelect }: MachineListProps) =>
  machines.length === 0 ? (
    <Notice message="Cet atelier ne publie aucune machine." />
  ) : (
    <View style={styles.list}>
      {machines.map((machine) => (
        <Pressable key={machine.id} accessibilityRole="button" onPress={() => onSelect(machine.id)}>
          <Surface>
            <View style={styles.body}>
              <Text variant="label">{machine.name}</Text>
              <Text tone="muted">{MACHINE_KIND_LABELS[machine.kind]}</Text>
              <View style={styles.badges}>
                <StatusBadge
                  tone={MACHINE_STATUS_TONES[machine.status]}
                  label={MACHINE_STATUS_LABELS[machine.status]}
                />
                {machine.requiresCertification ? <StatusBadge tone="warn" label="Habilitation requise" /> : null}
              </View>
            </View>
          </Surface>
        </Pressable>
      ))}
    </View>
  )

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  body: { gap: spacing[3] },
  list: { gap: spacing[4] },
})
