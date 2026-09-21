import { useLocalSearchParams } from 'expo-router'

import { BookingPage } from '@/features/bookings/detail/booking.page'

export default function BookingRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return <BookingPage id={id} />
}
