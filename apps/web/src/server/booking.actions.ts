'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'

import type { BookingActionState } from '@/modules/booking/core/model/booking'
import { BookingFailureCode } from '@/modules/booking/core/model/booking'

import { bookingPort, manageBookingPort } from './container'
import { requireSession } from './session'

export const createBookingAction = async (
  _state: BookingActionState,
  formData: FormData
): Promise<BookingActionState> => {
  const machineId = formData.get('machineId')
  const startAt = formData.get('startAt')
  if (typeof machineId !== 'string' || typeof startAt !== 'string') return { error: null }

  await requireSession(`/machines/${machineId}`)

  const result = await bookingPort.create({ machineId, startAt })
  if (!result.ok) {
    if (result.error.code === BookingFailureCode.UNAUTHORIZED) redirect(`/connexion?next=/machines/${machineId}`)
    return { error: result.error.message }
  }

  redirect(`/reservations/${result.value.id}`)
}

export const cancelBookingAction = async (
  _state: BookingActionState,
  formData: FormData
): Promise<BookingActionState> => {
  const bookingId = formData.get('bookingId')
  if (typeof bookingId !== 'string' || bookingId.length === 0) return { error: null }

  await requireSession(`/reservations/${bookingId}`)

  const result = await bookingPort.cancel(bookingId)
  if (!result.ok) {
    if (result.error.code === BookingFailureCode.UNAUTHORIZED) redirect(`/connexion?next=/reservations/${bookingId}`)
    return { error: result.error.message }
  }

  refresh()
  return { error: null }
}

export const manualCheckInAction = async (
  _state: BookingActionState,
  formData: FormData
): Promise<BookingActionState> => {
  const bookingId = formData.get('bookingId')
  if (typeof bookingId !== 'string' || bookingId.length === 0) return { error: null }

  await requireSession('/manage/bookings')

  const result = await manageBookingPort.checkIn(bookingId)
  if (!result.ok) {
    if (result.error.code === BookingFailureCode.UNAUTHORIZED) redirect('/connexion?next=/manage/bookings')
    return { error: result.error.message }
  }

  refresh()
  return { error: null }
}

export const markNoShowAction = async (_state: BookingActionState, formData: FormData): Promise<BookingActionState> => {
  const bookingId = formData.get('bookingId')
  if (typeof bookingId !== 'string' || bookingId.length === 0) return { error: null }

  await requireSession('/manage/bookings')

  const result = await manageBookingPort.markNoShow(bookingId)
  if (!result.ok) {
    if (result.error.code === BookingFailureCode.UNAUTHORIZED) redirect('/connexion?next=/manage/bookings')
    return { error: result.error.message }
  }

  refresh()
  return { error: null }
}

export const cancelAtelierBookingAction = async (
  _state: BookingActionState,
  formData: FormData
): Promise<BookingActionState> => {
  const bookingId = formData.get('bookingId')
  if (typeof bookingId !== 'string' || bookingId.length === 0) return { error: null }

  await requireSession('/manage/bookings')

  const result = await manageBookingPort.cancel(bookingId)
  if (!result.ok) {
    if (result.error.code === BookingFailureCode.UNAUTHORIZED) redirect('/connexion?next=/manage/bookings')
    return { error: result.error.message }
  }

  refresh()
  return { error: null }
}
