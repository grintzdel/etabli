import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { bookingDetailFixture } from '@/modules/booking/__tests__/booking.factory'
import { myCertificationFixture } from '@/modules/certification/__tests__/certification.factory'
import { buildOverview } from '@/modules/overview/core/model/overview'

import { OverviewBoard } from './OverviewBoard'

const now = new Date('2026-06-01T07:00:00.000Z')

const overviewOf = (bookings: Parameters<typeof buildOverview>[0]['bookings'], certifications = [], atelierCount = 1) =>
  buildOverview({ bookings, certifications, atelierCount, now })

describe('OverviewBoard', () => {
  it('puts the next booking first, with a link to its detail', () => {
    const booking = bookingDetailFixture({
      machineName: 'Bambu Lab P1S',
      startAt: '2026-06-01T08:00:00.000Z',
      endAt: '2026-06-01T10:00:00.000Z',
    })

    render(<OverviewBoard overview={overviewOf([booking])} displayName="Camille" />)

    expect(screen.getByRole('link', { name: /Bambu Lab P1S/ })).toHaveAttribute('href', `/reservations/${booking.id}`)
    expect(screen.getByText('10:00 – 12:00')).toBeInTheDocument()
  })

  it('sends a member with nothing booked towards the directory', () => {
    render(<OverviewBoard overview={overviewOf([])} displayName="Camille" />)

    expect(screen.getByText(/rien de prévu/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /réserver une machine/i })).toHaveAttribute('href', '/ateliers')
  })

  it('sends a member without an atelier back to onboarding', () => {
    render(<OverviewBoard overview={overviewOf([], [], 0)} displayName="Camille" />)

    expect(screen.getByRole('link', { name: /rejoindre un atelier/i })).toHaveAttribute('href', '/bienvenue')
  })

  it('announces a booking that can be checked in right now', () => {
    render(<OverviewBoard overview={overviewOf([bookingDetailFixture({ canCheckIn: true })])} displayName="Camille" />)

    expect(screen.getByText(/pointage ouvert/i)).toBeInTheDocument()
  })

  it('lists the certifications still awaiting a fabmanager', () => {
    const overview = buildOverview({
      bookings: [],
      certifications: [myCertificationFixture({ status: 'PENDING', machineName: 'Découpe laser' })],
      atelierCount: 1,
      now,
    })

    render(<OverviewBoard overview={overview} displayName="Camille" />)

    expect(screen.getByText('Découpe laser')).toBeInTheDocument()
  })

  it('greets the member by name', () => {
    render(<OverviewBoard overview={overviewOf([])} displayName="Camille" />)

    expect(screen.getByRole('heading', { level: 1, name: /Camille/ })).toBeInTheDocument()
  })
})
