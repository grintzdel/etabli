import { Button, StatusBadge, Surface, Text } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { Stack, useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { MACHINE_KIND_LABELS, MACHINE_STATUS_LABELS, MACHINE_STATUS_TONES } from '@/modules/atelier/core/model/atelier'
import { useMachine } from '@/modules/atelier/ui/hooks/use-machine'
import { SlotGrid } from '@/modules/booking/ui/components/SlotGrid'
import { useMachineWeek } from '@/modules/booking/ui/hooks/use-machine-week'
import { MY_STATUS_LABELS, MY_STATUS_TONES } from '@/modules/certification/core/model/certification'
import { useMachineCertification } from '@/modules/certification/ui/hooks/use-machine-certification'
import { Loader } from '@/modules/shared/ui/components/Loader'
import { Notice } from '@/modules/shared/ui/components/Notice'
import { Screen } from '@/modules/shared/ui/components/Screen'
import { ScreenTitle } from '@/modules/shared/ui/components/ScreenTitle'

export const MachinePage = ({ id }: { readonly id: string }) => {
  const router = useRouter()
  const { machine, isPending, error } = useMachine(id)
  const week = useMachineWeek(id, (booking) => router.push(`/bookings/${booking.id}`))
  const certification = useMachineCertification(id)

  return (
    <Screen>
      <Stack.Screen options={{ title: machine?.name ?? 'Machine' }} />

      {error === null ? null : <Notice tone="danger" title="Machine" message={error} />}
      {isPending ? <Loader /> : null}

      {machine === null ? null : (
        <>
          <ScreenTitle title={machine.name} subtitle={machine.atelierName} />
          <Surface>
            <View style={styles.facts}>
              <Text tone="muted">{machine.description}</Text>
              <View style={styles.badges}>
                <StatusBadge label={MACHINE_KIND_LABELS[machine.kind]} />
                <StatusBadge
                  tone={MACHINE_STATUS_TONES[machine.status]}
                  label={MACHINE_STATUS_LABELS[machine.status]}
                />
                <StatusBadge label={`Créneau de ${machine.slotDurationMinutes} min`} />
                {machine.requiresCertification ? <StatusBadge tone="warn" label="Habilitation requise" /> : null}
              </View>
            </View>
          </Surface>

          {certification.status === null ? null : (
            <Surface>
              <View style={styles.facts}>
                <Text variant="label">Habilitation</Text>
                <View style={styles.footer}>
                  <StatusBadge
                    tone={MY_STATUS_TONES[certification.status]}
                    label={MY_STATUS_LABELS[certification.status]}
                  />
                  {certification.canRequest ? (
                    <Button size="sm" disabled={certification.isRequesting} onPress={certification.request}>
                      {certification.isRequesting ? 'Envoi…' : 'Demander'}
                    </Button>
                  ) : null}
                </View>
                {certification.error === null ? null : <Notice tone="danger" message={certification.error} />}
              </View>
            </Surface>
          )}
        </>
      )}

      <Text variant="label">Semaine</Text>

      {week.error === null ? null : <Notice message={week.error} />}
      {week.bookingError === null ? null : <Notice tone="danger" title="Réservation" message={week.bookingError} />}

      {week.isPending ? (
        <Loader />
      ) : week.availability === null ? null : (
        <>
          <View style={styles.nav}>
            <Button size="sm" variant="ghost" disabled={!week.canGoBack} onPress={week.goBack}>
              Semaine précédente
            </Button>
            <Button size="sm" variant="ghost" onPress={week.goNext}>
              Semaine suivante
            </Button>
          </View>
          <SlotGrid days={week.days} disabled={week.isBooking} onPick={week.book} />
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  facts: { gap: spacing[3] },
  footer: { alignItems: 'center', flexDirection: 'row', gap: spacing[3], justifyContent: 'space-between' },
  nav: { flexDirection: 'row', gap: spacing[3], justifyContent: 'space-between' },
})
