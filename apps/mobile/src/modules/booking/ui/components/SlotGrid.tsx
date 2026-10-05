import { Button, Surface, Text } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { StyleSheet, View } from 'react-native'

import { formatTime } from '../../core/lib/format'
import type { SlotDay } from '../../core/lib/slots'
import { SLOT_REASON_LABELS } from '../../core/model/booking'

export type SlotGridProps = {
  readonly days: ReadonlyArray<SlotDay>
  readonly selectedStartAt: string | null
  readonly disabled: boolean
  readonly onPick: (startAt: string) => void
}

export const SlotGrid = ({ days, selectedStartAt, disabled, onPick }: SlotGridProps) => (
  <View style={styles.days}>
    {days.map((day) => (
      <Surface key={day.key}>
        <View style={styles.day}>
          <Text variant="label">{day.label}</Text>
          <View style={styles.slots}>
            {day.slots.map((slot) => (
              <Button
                key={slot.startAt}
                size="sm"
                variant={slot.startAt === selectedStartAt ? 'primary' : 'ghost'}
                disabled={disabled || !slot.available}
                accessibilityState={{ selected: slot.startAt === selectedStartAt }}
                accessibilityLabel={`${formatTime(slot.startAt)} — ${SLOT_REASON_LABELS[slot.reason]}`}
                onPress={() => onPick(slot.startAt)}
              >
                {formatTime(slot.startAt)}
              </Button>
            ))}
          </View>
        </View>
      </Surface>
    ))}
  </View>
)

const styles = StyleSheet.create({
  day: { gap: spacing[3] },
  days: { gap: spacing[4] },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
})
