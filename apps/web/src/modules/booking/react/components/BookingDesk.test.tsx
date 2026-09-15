import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { atelierBookingFixture } from '@/modules/booking/__tests__/booking.factory'

import { BookingDesk } from './BookingDesk'

const noop = vi.fn().mockResolvedValue({ error: null })

describe('BookingDesk', () => {
  it('names the member and the machine of each slot', () => {
    render(
      <BookingDesk
        bookings={[atelierBookingFixture({ machineName: 'Trotec Speedy', memberName: 'Camille Roux' })]}
        checkIn={noop}
      />
    )

    expect(screen.getByText('Trotec Speedy')).toBeVisible()
    expect(screen.getByText('Camille Roux')).toBeVisible()
  })

  it('offers the stamp only while the window is open', () => {
    render(<BookingDesk bookings={[atelierBookingFixture({ canCheckIn: false })]} checkIn={noop} />)

    expect(screen.queryByRole('button', { name: /pointer/i })).toBeNull()
  })

  it('names how a slot already stamped was stamped', () => {
    render(
      <BookingDesk bookings={[atelierBookingFixture({ checkedInVia: 'MANUAL', canCheckIn: false })]} checkIn={noop} />
    )

    expect(screen.getByText('À la main')).toBeVisible()
    expect(screen.queryByRole('button', { name: /pointer/i })).toBeNull()
  })

  it('says so when the day holds nothing', () => {
    render(<BookingDesk bookings={[]} checkIn={noop} />)

    expect(screen.getByText(/aucune réservation ce jour-là/i)).toBeVisible()
  })
})
