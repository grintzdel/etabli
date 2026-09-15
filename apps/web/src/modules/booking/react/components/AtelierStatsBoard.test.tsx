import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { atelierStatsFixture, machineUsageFixture } from '@/modules/booking/__tests__/booking.factory'

import { AtelierStatsBoard } from './AtelierStatsBoard'

describe('AtelierStatsBoard', () => {
  it('says so when the caller runs no atelier', () => {
    render(<AtelierStatsBoard stats={[]} />)

    expect(screen.getByText(/vous ne pilotez aucun atelier/i)).toBeVisible()
  })

  it('reads the hours and the rate of the atelier', () => {
    render(
      <AtelierStatsBoard
        stats={[atelierStatsFixture({ atelierName: 'Copeaux & Cie', occupancyRate: 0.375, consumedHours: 2.5 })]}
      />
    )

    expect(screen.getByRole('heading', { name: 'Copeaux & Cie' })).toBeVisible()
    expect(screen.getByText('38 %')).toBeVisible()
    expect(screen.getByText('2 h 30')).toBeVisible()
    expect(screen.getByText('420 h')).toBeVisible()
  })

  it('splits the figures machine by machine', () => {
    render(
      <AtelierStatsBoard
        stats={[
          atelierStatsFixture({
            machines: [
              machineUsageFixture({ machineName: 'Trotec', bookings: 3, bookedHours: 6, occupancyRate: 0.1 }),
              machineUsageFixture({ machineName: 'Prusa', noShows: 2 }),
            ],
          }),
        ]}
      />
    )

    const trotec = screen.getByRole('row', { name: /trotec/i })
    expect(trotec).toHaveTextContent('10 %')
    expect(trotec).toHaveTextContent('6 h')
    expect(screen.getByRole('row', { name: /prusa/i })).toHaveTextContent('2')
  })

  it('says so when the atelier holds no machine', () => {
    render(<AtelierStatsBoard stats={[atelierStatsFixture({ machines: [] })]} />)

    expect(screen.getByText(/aucune machine dans cet atelier/i)).toBeVisible()
  })

  it('boards every atelier the caller runs', () => {
    render(
      <AtelierStatsBoard
        stats={[atelierStatsFixture({ atelierName: 'La Forge' }), atelierStatsFixture({ atelierName: 'Lyon' })]}
      />
    )

    expect(screen.getAllByRole('heading')).toHaveLength(2)
  })
})
