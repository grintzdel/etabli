import { Button, Surface, Text } from '@etabli/ui'
import { colors, radii, spacing } from '@etabli/ui/tokens'
import { useState } from 'react'
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native'

import { formatTime } from '../../core/lib/format'
import type { SlotDay } from '../../core/lib/slots'
import { SLOT_REASON_LABELS } from '../../core/model/booking'

export type SlotGridProps = {
  readonly days: ReadonlyArray<SlotDay>
  readonly selectedStartAt: string | null
  readonly disabled: boolean
  readonly onPick: (startAt: string) => void
}

type DayPanelProps = Omit<SlotGridProps, 'days'> & {
  readonly day: SlotDay
  readonly initiallyOpen: boolean
}

const freeLabelOf = (count: number): string =>
  count === 0 ? 'Complet' : count === 1 ? '1 créneau libre' : `${count} créneaux libres`

const DayPanel = ({ day, initiallyOpen, selectedStartAt, disabled, onPick }: DayPanelProps) => {
  const [open, setOpen] = useState(initiallyOpen)
  const palette = colors[useColorScheme() === 'light' ? 'light' : 'dark']

  return (
    <Surface style={styles.panel}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${day.label}, ${freeLabelOf(day.freeCount)}`}
        onPress={() => setOpen((previous) => !previous)}
        style={styles.summary}
      >
        <View style={[styles.leaf, { backgroundColor: palette.graphite[950], borderColor: palette.graphite[700] }]}>
          <Text variant="label" tone="accent" style={styles.leafEdge}>
            {day.weekday}
          </Text>
          <Text variant="heading">{day.date}</Text>
          <Text variant="label" tone="muted" style={styles.leafEdge}>
            {day.month}
          </Text>
        </View>
        <View style={styles.heading}>
          <Text variant="label">{day.label}</Text>
          <Text variant="caption" tone="muted">
            {freeLabelOf(day.freeCount)}
          </Text>
        </View>
        <Text tone="muted">{open ? '▴' : '▾'}</Text>
      </Pressable>

      {open ? (
        <View style={[styles.slots, { borderColor: palette.graphite[800] }]}>
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
      ) : null}
    </Surface>
  )
}

export const SlotGrid = ({ days, ...props }: SlotGridProps) => (
  <View style={styles.days}>
    {days.map((day, index) => (
      <DayPanel key={day.key} day={day} initiallyOpen={index === 0} {...props} />
    ))}
  </View>
)

const styles = StyleSheet.create({
  days: { gap: spacing[3] },
  heading: { flex: 1, gap: spacing[1] },
  leaf: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingVertical: spacing[1],
    width: 56,
  },
  leafEdge: { fontSize: 10, lineHeight: 14 },
  panel: { padding: 0 },
  slots: {
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    padding: spacing[4],
  },
  summary: { alignItems: 'center', flexDirection: 'row', gap: spacing[4], padding: spacing[4] },
})
