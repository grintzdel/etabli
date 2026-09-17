import { dependencies } from '../../../app/core/dependencies'
import { useApiQuery } from '../../../app/ui/hooks/use-api-query'
import { partitionBookings, type BookingDetail } from '../../core/model/booking'

export const useMyBookings = () => {
  const query = useApiQuery<ReadonlyArray<BookingDetail>>(['bookings'], (token) => dependencies.booking.list(token))
  const partition = partitionBookings(query.data ?? [], new Date())

  return {
    upcoming: partition.upcoming,
    past: partition.past,
    isPending: query.isPending,
    error: query.error?.message ?? null,
    refresh: () => void query.refetch(),
    isRefreshing: query.isFetching && !query.isPending,
  }
}
