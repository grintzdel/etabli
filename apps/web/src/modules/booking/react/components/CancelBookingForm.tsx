'use client'

import { Button } from '@etabli/ui'
import { useActionState } from 'react'

import type { BookingActionState } from '@/modules/booking/core/model/booking'

export type CancelBookingFormProps = {
  readonly bookingId: string
  readonly action: (state: BookingActionState, formData: FormData) => Promise<BookingActionState>
}

export const CancelBookingForm = ({ bookingId, action }: CancelBookingFormProps) => {
  const [state, submit, pending] = useActionState(action, { error: null })

  return (
    <form action={submit} className="flex flex-col items-start gap-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? 'Annulation…' : 'Annuler la réservation'}
      </Button>
      {state.error === null ? null : (
        <p role="alert" className="text-status-danger text-sm">
          {state.error}
        </p>
      )}
    </form>
  )
}
