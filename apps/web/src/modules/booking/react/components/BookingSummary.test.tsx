import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { bookingDetailFixture } from '@/modules/booking/__tests__/booking.factory'

import { BookingSummary } from './BookingSummary'

const noop = vi.fn()

describe('BookingSummary', () => {
  it('offers to cancel a booking that still can be', () => {
    render(<BookingSummary booking={bookingDetailFixture({ canCancel: true })} cancel={noop} />)

    expect(screen.getByRole('button', { name: /annuler la réservation/i })).toBeInTheDocument()
  })

  it('says why a started slot no longer cancels', () => {
    render(<BookingSummary booking={bookingDetailFixture({ canCancel: false })} cancel={noop} />)

    expect(screen.queryByRole('button', { name: /annuler la réservation/i })).not.toBeInTheDocument()
    expect(screen.getByText(/un créneau commencé ne s’annule plus/i)).toBeInTheDocument()
  })

  it('says a closed booking is closed', () => {
    render(<BookingSummary booking={bookingDetailFixture({ canCancel: false, status: 'CANCELLED' })} cancel={noop} />)

    expect(screen.getByText(/cette réservation est close/i)).toBeInTheDocument()
  })

  it('points to the tag when the check-in window is open', () => {
    render(<BookingSummary booking={bookingDetailFixture({ canCheckIn: true })} cancel={noop} />)

    expect(screen.getByText(/approchez votre téléphone du tag/i)).toBeInTheDocument()
  })

  it('links back to the atelier', () => {
    render(<BookingSummary booking={bookingDetailFixture({ atelierSlug: 'la-forge-montreuil' })} cancel={noop} />)

    expect(screen.getByRole('link', { name: 'La Forge' })).toHaveAttribute('href', '/ateliers/la-forge-montreuil')
  })

  it('dates the check-in once it happened', () => {
    render(
      <BookingSummary
        booking={bookingDetailFixture({ checkedInAt: '2026-06-01T08:05:00.000Z', status: 'CHECKED_IN' })}
        cancel={noop}
      />
    )

    expect(screen.getByText('lundi 1 juin à 10:05')).toBeInTheDocument()
  })
})
