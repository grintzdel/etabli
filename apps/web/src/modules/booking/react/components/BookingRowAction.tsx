'use client'

import { useActionState } from 'react'

import type { BookingActionState } from '@/modules/booking/core/model/booking'
import { Button } from '@/ui/Button'

export type BookingRowActionProps = {
  readonly bookingId: string
  readonly label: string
  readonly pendingLabel: string
  readonly variant?: 'primary' | 'ghost' | 'danger'
  readonly action: (state: BookingActionState, formData: FormData) => Promise<BookingActionState>
}

export const BookingRowAction = ({ bookingId, label, pendingLabel, variant, action }: BookingRowActionProps) => {
  const [state, submit, pending] = useActionState(action, { error: null })

  return (
    <form action={submit} className="flex flex-col items-start gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {pending ? pendingLabel : label}
      </Button>
      {state.error === null ? null : (
        <p role="alert" className="text-status-danger text-sm">
          {state.error}
        </p>
      )}
    </form>
  )
}
