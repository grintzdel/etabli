import { Button, StatusBadge, Surface, Text } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { Stack } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { formatMoment, formatRange } from '@/modules/booking/core/lib/format'
import { STATUS_LABELS, STATUS_TONES } from '@/modules/booking/core/model/booking'
import { useBookingDetail } from '@/modules/booking/ui/hooks/use-booking-detail'
import { Loader } from '@/modules/shared/ui/components/Loader'
import { Notice } from '@/modules/shared/ui/components/Notice'
import { Screen } from '@/modules/shared/ui/components/Screen'
import { ScreenTitle } from '@/modules/shared/ui/components/ScreenTitle'

export const BookingPage = ({ id }: { readonly id: string }) => {
  const detail = useBookingDetail(id)
  const booking = detail.booking

  return (
    <Screen>
      <Stack.Screen options={{ title: booking?.machineName ?? 'Réservation' }} />

      {detail.error === null ? null : <Notice tone="danger" title="Réservation" message={detail.error} />}
      {detail.isPending ? <Loader /> : null}

      {booking === null ? null : (
        <>
          <ScreenTitle title={booking.machineName} subtitle={booking.atelierName} />

          <Surface>
            <View style={styles.facts}>
              <StatusBadge tone={STATUS_TONES[booking.status]} label={STATUS_LABELS[booking.status]} />
              <Text>{formatMoment(booking.startAt)}</Text>
              <Text tone="muted">{formatRange(booking.startAt, booking.endAt)}</Text>
              {booking.checkedInAt === null ? null : (
                <Text variant="caption" tone="muted">{`Pointée ${formatMoment(booking.checkedInAt)}`}</Text>
              )}
            </View>
          </Surface>

          {detail.checkInError === null ? null : (
            <Notice tone="danger" title="Pointage" message={detail.checkInError} />
          )}
          {detail.cancelError === null ? null : (
            <Notice tone="danger" title="Annulation" message={detail.cancelError} />
          )}

          {booking.canCheckIn ? (
            <Surface>
              <View style={styles.facts}>
                <Text variant="label">Pointer</Text>
                <Text tone="muted">
                  Scannez le QR code collé sur la machine. Le serveur vérifie que c’est bien celui de la machine
                  réservée.
                </Text>
                <Button disabled={detail.isCheckingIn} onPress={detail.checkIn}>
                  {detail.isCheckingIn ? 'Scan…' : 'Pointer'}
                </Button>
              </View>
            </Surface>
          ) : null}

          {booking.canCancel ? (
            <Button variant="danger" disabled={detail.isCancelling} onPress={detail.cancel}>
              {detail.isCancelling ? 'Annulation…' : 'Annuler la réservation'}
            </Button>
          ) : null}
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  facts: { alignItems: 'flex-start', gap: spacing[3] },
})
