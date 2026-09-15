'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'

import type { BookingActionState } from '@/modules/booking/core/model/booking'
import { BookingFailureCode } from '@/modules/booking/core/model/booking'

import { bookingPort } from './container'
import { readSessionToken } from './session'

export const cancelBookingAction = async (
  _state: BookingActionState,
  formData: FormData
): Promise<BookingActionState> => {
  const bookingId = formData.get('bookingId')
  if (typeof bookingId !== 'string' || bookingId.length === 0) return { error: null }

  const token = await readSessionToken()
  if (token === null) redirect(`/connexion?next=/reservations/${bookingId}`)

  const result = await bookingPort.cancel(token, bookingId)
  if (!result.ok) {
    if (result.error.code === BookingFailureCode.UNAUTHORIZED) redirect(`/connexion?next=/reservations/${bookingId}`)
    return { error: result.error.message }
  }

  refresh()
  return { error: null }
}
