import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { dependencies } from '../../../app/core/dependencies'
import { useApiMutation, useApiQuery } from '../../../app/ui/hooks/use-api-query'
import type { BookingDetail } from '../../core/model/booking'

export const useBookingDetail = (id: string) => {
  const queryClient = useQueryClient()
  const [scanError, setScanError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const query = useApiQuery<BookingDetail>(['booking', id], () => dependencies.booking.getById(id))

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['booking', id] })
    void queryClient.invalidateQueries({ queryKey: ['bookings'] })
  }

  const cancel = useApiMutation<BookingDetail, void>(
    () => dependencies.booking.cancel(id),
    () => refreshAll()
  )

  const checkIn = useApiMutation<BookingDetail, string>(
    (checkInToken) => dependencies.booking.checkIn(id, checkInToken),
    () => refreshAll()
  )

  const scanAndCheckIn = async () => {
    setScanError(null)
    setIsScanning(true)
    const scanned = await dependencies.scanner.scan()
    setIsScanning(false)
    if (!scanned.ok) {
      setScanError(scanned.error.message)
      return
    }
    checkIn.mutate(scanned.value)
  }

  return {
    booking: query.data ?? null,
    isPending: query.isPending,
    error: query.error?.message ?? null,
    cancel: () => cancel.mutate(),
    isCancelling: cancel.isPending,
    cancelError: cancel.error?.message ?? null,
    checkIn: () => void scanAndCheckIn(),
    isCheckingIn: isScanning || checkIn.isPending,
    checkInError: scanError ?? checkIn.error?.message ?? null,
  }
}
