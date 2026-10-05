import { Button, Text } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { StyleSheet, View } from 'react-native'

import { formatDay, formatRange } from '../../core/lib/format'
import type { AvailabilitySlot, BookingEligibility } from '../../core/model/booking'

export type SlotGateProps = {
  readonly slot: AvailabilitySlot
  readonly eligibility: BookingEligibility
  readonly atelierName: string
  readonly isBooking: boolean
  readonly onBook: () => void
  readonly onSignIn: () => void
  readonly onJoin: () => void
}

const messageOf = (eligibility: BookingEligibility, atelierName: string): string | null => {
  switch (eligibility) {
    case 'ANONYMOUS':
      return 'Connectez-vous pour réserver ce créneau : il vous attendra au retour.'
    case 'NOT_MEMBER':
      return `Les créneaux de ${atelierName} sont réservés à ses membres. Rejoignez l’atelier, puis revenez sur ce créneau.`
    case 'CERTIFICATION_REQUIRED':
      return 'Cette machine exige une habilitation, accordée par un fabmanager. Le créneau n’est pas retenu pendant la demande.'
    case 'CERTIFICATION_PENDING':
      return 'Votre demande d’habilitation attend la décision d’un fabmanager. Vous pourrez réserver dès qu’elle sera accordée.'
    case 'READY':
      return null
  }
}

export const SlotGate = ({ slot, eligibility, atelierName, isBooking, onBook, onSignIn, onJoin }: SlotGateProps) => {
  const message = messageOf(eligibility, atelierName)

  return (
    <View style={styles.body}>
      <Text variant="label">{`${formatDay(slot.startAt)}, ${formatRange(slot.startAt, slot.endAt)}`}</Text>
      {message === null ? null : <Text tone="muted">{message}</Text>}
      {eligibility === 'READY' ? (
        <Button disabled={isBooking} onPress={onBook}>
          {isBooking ? 'Réservation…' : 'Réserver ce créneau'}
        </Button>
      ) : null}
      {eligibility === 'ANONYMOUS' ? <Button onPress={onSignIn}>Se connecter pour réserver</Button> : null}
      {eligibility === 'NOT_MEMBER' ? <Button onPress={onJoin}>{`Rejoindre ${atelierName}`}</Button> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  body: { gap: spacing[3] },
})
