import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { dependencies } from '../../../app/core/dependencies'
import { useApiMutation, useApiQuery } from '../../../app/ui/hooks/use-api-query'
import { groupSlotsByDay } from '../../core/lib/slots'
import type { BookingDetail, MachineAvailability } from '../../core/model/booking'

export const useMachineWeek = (machineId: string, onBooked: (booking: BookingDetail) => void) => {
  const [stack, setStack] = useState<ReadonlyArray<string>>([])
  const from = stack.at(-1)
  const queryClient = useQueryClient()

  const query = useApiQuery<MachineAvailability>(['availability', machineId, from ?? 'now'], (token) =>
    dependencies.booking.availability(token, machineId, from)
  )

  const booking = useApiMutation<BookingDetail, string>(
    (token, startAt) => dependencies.booking.create(token, { machineId, startAt }),
    (created) => {
      void queryClient.invalidateQueries({ queryKey: ['availability', machineId] })
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      onBooked(created)
    }
  )

  return {
    availability: query.data ?? null,
    days: groupSlotsByDay(query.data?.slots ?? []),
    isPending: query.isPending,
    error: query.error?.message ?? null,
    canGoBack: stack.length > 0,
    goNext: () => {
      const to = query.data?.to
      if (to !== undefined) setStack((previous) => [...previous, to])
    },
    goBack: () => setStack((previous) => previous.slice(0, -1)),
    book: (startAt: string) => booking.mutate(startAt),
    isBooking: booking.isPending,
    bookingError: booking.error?.message ?? null,
  }
}
