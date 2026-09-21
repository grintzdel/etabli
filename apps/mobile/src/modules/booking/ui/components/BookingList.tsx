import { StatusBadge, Surface, Text } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { Pressable, StyleSheet, View } from 'react-native'

import { formatMoment, formatRange } from '../../core/lib/format'
import { STATUS_LABELS, STATUS_TONES, type BookingDetail } from '../../core/model/booking'

export type BookingListProps = {
  readonly bookings: ReadonlyArray<BookingDetail>
  readonly onSelect: (id: string) => void
}

export const BookingList = ({ bookings, onSelect }: BookingListProps) => (
  <View style={styles.list}>
    {bookings.map((booking) => (
      <Pressable key={booking.id} accessibilityRole="button" onPress={() => onSelect(booking.id)}>
        <Surface>
          <View style={styles.body}>
            <View style={styles.header}>
              <Text variant="label">{booking.machineName}</Text>
              <StatusBadge tone={STATUS_TONES[booking.status]} label={STATUS_LABELS[booking.status]} />
            </View>
            <Text tone="muted">{booking.atelierName}</Text>
            <Text>{formatMoment(booking.startAt)}</Text>
            <Text variant="caption" tone="muted">
              {formatRange(booking.startAt, booking.endAt)}
            </Text>
          </View>
        </Surface>
      </Pressable>
    ))}
  </View>
)

const styles = StyleSheet.create({
  body: { gap: spacing[2] },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing[3], justifyContent: 'space-between' },
  list: { gap: spacing[4] },
})
