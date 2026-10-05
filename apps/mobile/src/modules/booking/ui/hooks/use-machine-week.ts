import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { dependencies } from '../../../app/core/dependencies'
import { useApiMutation, usePublicQuery } from '../../../app/ui/hooks/use-api-query'
import { groupSlotsByDay } from '../../core/lib/slots'
import type { BookingDetail, MachineAvailability } from '../../core/model/booking'

export const useMachineWeek = (machineId: string, onBooked: (booking: BookingDetail) => void) => {
  const [stack, setStack] = useState<ReadonlyArray<string>>([])
  const [selected, setSelected] = useState<string | null>(null)
  const from = stack.at(-1)
  const queryClient = useQueryClient()

  const query = usePublicQuery<MachineAvailability>(['availability', machineId, from ?? 'now'], () =>
    dependencies.booking.availability(machineId, from)
  )

  const booking = useApiMutation<BookingDetail, string>(
    (startAt) => dependencies.booking.create({ machineId, startAt }),
    (created) => {
      setSelected(null)
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
      if (to === undefined) return
      setSelected(null)
      setStack((previous) => [...previous, to])
    },
    goBack: () => {
      setSelected(null)
      setStack((previous) => previous.slice(0, -1))
    },
    selected: query.data?.slots.find((slot) => slot.startAt === selected) ?? null,
    select: setSelected,
    book: () => {
      if (selected !== null) booking.mutate(selected)
    },
    isBooking: booking.isPending,
    bookingError: booking.error?.message ?? null,
  }
}
