import { Text } from '@etabli/ui'
import { useRouter } from 'expo-router'

import { BookingList } from '@/modules/booking/ui/components/BookingList'
import { useMyBookings } from '@/modules/booking/ui/hooks/use-my-bookings'
import { Loader } from '@/modules/shared/ui/components/Loader'
import { Notice } from '@/modules/shared/ui/components/Notice'
import { Screen } from '@/modules/shared/ui/components/Screen'
import { ScreenTitle } from '@/modules/shared/ui/components/ScreenTitle'

export const BookingsPage = () => {
  const router = useRouter()
  const bookings = useMyBookings()
  const open = (id: string) => router.push(`/bookings/${id}`)

  return (
    <Screen onRefresh={bookings.refresh} refreshing={bookings.isRefreshing}>
      <ScreenTitle title="Mes réservations" />

      {bookings.error === null ? null : <Notice tone="danger" title="Réservations" message={bookings.error} />}

      {bookings.isPending ? (
        <Loader />
      ) : bookings.upcoming.length === 0 && bookings.past.length === 0 ? (
        <Notice message="Vous n’avez encore réservé aucun créneau." />
      ) : (
        <>
          {bookings.upcoming.length === 0 ? null : (
            <>
              <Text variant="label">À venir</Text>
              <BookingList bookings={bookings.upcoming} onSelect={open} />
            </>
          )}
          {bookings.past.length === 0 ? null : (
            <>
              <Text variant="label">Passées</Text>
              <BookingList bookings={bookings.past} onSelect={open} />
            </>
          )}
        </>
      )}
    </Screen>
  )
}
