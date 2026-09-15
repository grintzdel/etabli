import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { bookingDetailFixture } from '@/modules/booking/__tests__/booking.factory'

import { BookingList } from './BookingList'

describe('BookingList', () => {
  it('links every machine to its own booking', () => {
    const booking = bookingDetailFixture({ machineName: 'Bambu Lab P1S' })

    render(<BookingList bookings={[booking]} caption="Réservations à venir" />)

    expect(screen.getByRole('link', { name: 'Bambu Lab P1S' })).toHaveAttribute('href', `/reservations/${booking.id}`)
  })

  it('shows the slot in the atelier’s time zone', () => {
    render(
      <BookingList
        bookings={[bookingDetailFixture({ startAt: '2026-06-01T08:00:00.000Z', endAt: '2026-06-01T10:00:00.000Z' })]}
        caption="Réservations à venir"
      />
    )

    expect(screen.getByText('lundi 1 juin')).toBeInTheDocument()
    expect(screen.getByText('10:00 – 12:00')).toBeInTheDocument()
  })

  it('names the status of each booking', () => {
    render(<BookingList bookings={[bookingDetailFixture({ status: 'NO_SHOW' })]} caption="Réservations passées" />)

    expect(screen.getByText('Non honorée')).toBeInTheDocument()
  })
})
