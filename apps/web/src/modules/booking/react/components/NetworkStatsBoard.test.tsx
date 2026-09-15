import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { atelierStatsFixture, networkStatsFixture } from '@/modules/booking/__tests__/booking.factory'

import { NetworkStatsBoard } from './NetworkStatsBoard'

describe('NetworkStatsBoard', () => {
  it('says so when no atelier of the network holds a machine', () => {
    render(<NetworkStatsBoard stats={networkStatsFixture()} />)

    expect(screen.getByText(/aucun atelier du réseau ne tient encore de machine/i)).toBeVisible()
  })

  it('reads the totals of the network', () => {
    render(
      <NetworkStatsBoard
        stats={networkStatsFixture({ ateliers: 3, machines: 12, occupancyRate: 0.42, consumedHours: 7.5 })}
      />
    )

    expect(screen.getByText('3')).toBeVisible()
    expect(screen.getByText('12')).toBeVisible()
    expect(screen.getByText('42 %')).toBeVisible()
    expect(screen.getByText('7 h 30')).toBeVisible()
  })

  it('reads one row per atelier, with its park', () => {
    render(
      <NetworkStatsBoard
        stats={networkStatsFixture({
          ateliers: 2,
          byAtelier: [
            atelierStatsFixture({ atelierName: 'Copeaux & Cie', occupancyRate: 0.5, bookedHours: 4 }),
            atelierStatsFixture({ atelierName: 'Lyon Fabrique' }),
          ],
        })}
      />
    )

    const copeaux = screen.getByRole('row', { name: /copeaux & cie/i })
    expect(copeaux).toHaveTextContent('50 %')
    expect(copeaux).toHaveTextContent('4 h')
    expect(screen.getByRole('row', { name: /lyon fabrique/i })).toBeVisible()
  })
})
