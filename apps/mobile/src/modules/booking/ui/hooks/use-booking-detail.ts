import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { dependencies } from '../../../app/core/dependencies'
import { useApiMutation, useApiQuery } from '../../../app/ui/hooks/use-api-query'
import type { BookingDetail } from '../../core/model/booking'

export const useBookingDetail = (id: string) => {
  const queryClient = useQueryClient()
  const [nfcError, setNfcError] = useState<string | null>(null)
  const [isReading, setIsReading] = useState(false)

  const query = useApiQuery<BookingDetail>(['booking', id], (token) => dependencies.booking.getById(token, id))

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['booking', id] })
    void queryClient.invalidateQueries({ queryKey: ['bookings'] })
  }

  const cancel = useApiMutation<BookingDetail, void>(
    (token) => dependencies.booking.cancel(token, id),
    () => refreshAll()
  )

  const checkIn = useApiMutation<BookingDetail, string>(
    (token, nfcTagId) => dependencies.booking.checkIn(token, id, nfcTagId),
    () => refreshAll()
  )

  const readAndCheckIn = async () => {
    setNfcError(null)
    setIsReading(true)
    const read = await dependencies.nfc.readTagId()
    setIsReading(false)
    if (!read.ok) {
      setNfcError(read.error.message)
      return
    }
    checkIn.mutate(read.value)
  }

  return {
    booking: query.data ?? null,
    isPending: query.isPending,
    error: query.error?.message ?? null,
    cancel: () => cancel.mutate(),
    isCancelling: cancel.isPending,
    cancelError: cancel.error?.message ?? null,
    checkIn: () => void readAndCheckIn(),
    isCheckingIn: isReading || checkIn.isPending,
    checkInError: nfcError ?? checkIn.error?.message ?? null,
  }
}
