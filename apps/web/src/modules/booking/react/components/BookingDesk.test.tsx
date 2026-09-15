import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { atelierBookingFixture } from '@/modules/booking/__tests__/booking.factory'

import { BookingDesk } from './BookingDesk'

const noop = vi.fn().mockResolvedValue({ error: null })

const desk = (bookings: Parameters<typeof BookingDesk>[0]['bookings']) => (
  <BookingDesk bookings={bookings} checkIn={noop} markNoShow={noop} />
)

describe('BookingDesk', () => {
  it('names the member and the machine of each slot', () => {
    render(desk([atelierBookingFixture({ machineName: 'Trotec Speedy', memberName: 'Camille Roux' })]))

    expect(screen.getByText('Trotec Speedy')).toBeVisible()
    expect(screen.getByText('Camille Roux')).toBeVisible()
  })

  it('offers the stamp only while the window is open', () => {
    render(desk([atelierBookingFixture({ canCheckIn: false })]))

    expect(screen.queryByRole('button', { name: /pointer/i })).toBeNull()
  })

  it('names how a slot already stamped was stamped', () => {
    render(desk([atelierBookingFixture({ checkedInVia: 'MANUAL', canCheckIn: false })]))

    expect(screen.getByText('À la main')).toBeVisible()
    expect(screen.queryByRole('button', { name: /pointer/i })).toBeNull()
  })

  it('offers the no-show once the window has closed on nobody', () => {
    render(desk([atelierBookingFixture({ canCheckIn: false, canMarkNoShow: true })]))

    expect(screen.getByRole('button', { name: /marquer non honorée/i })).toBeVisible()
  })

  it('leaves the no-show out while the stamp is still on offer', () => {
    render(desk([atelierBookingFixture({ canCheckIn: true, canMarkNoShow: false })]))

    expect(screen.getByRole('button', { name: /pointer/i })).toBeVisible()
    expect(screen.queryByRole('button', { name: /marquer non honorée/i })).toBeNull()
  })

  it('says so when the day holds nothing', () => {
    render(desk([]))

    expect(screen.getByText(/aucune réservation ce jour-là/i)).toBeVisible()
  })
})
