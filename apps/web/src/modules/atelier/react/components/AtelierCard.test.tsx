import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { summaryFixture } from '@/modules/atelier/__tests__/atelier.factory'

import { AtelierCard } from './AtelierCard'

describe('AtelierCard', () => {
  it('links its heading to the public sheet', () => {
    render(<AtelierCard atelier={summaryFixture({ slug: 'la-forge', name: 'La Forge' })} />)
    expect(screen.getByRole('link', { name: 'La Forge' })).toHaveAttribute('href', '/ateliers/la-forge')
  })

  it('names the machine kinds in French', () => {
    render(<AtelierCard atelier={summaryFixture({ machineKinds: ['LASER_CUTTER', 'SEWING'] })} />)
    expect(screen.getByText('Découpe laser')).toBeInTheDocument()
    expect(screen.getByText('Couture')).toBeInTheDocument()
  })

  it('agrees the machine count in number', () => {
    const { rerender } = render(<AtelierCard atelier={summaryFixture({ machineCount: 1 })} />)
    expect(screen.getByText('1 machine')).toBeInTheDocument()

    rerender(<AtelierCard atelier={summaryFixture({ machineCount: 4 })} />)
    expect(screen.getByText('4 machines')).toBeInTheDocument()
  })

  it('says so when the parc is empty', () => {
    render(<AtelierCard atelier={summaryFixture({ machineCount: 0, machineKinds: [] })} />)
    expect(screen.getByText('Aucune machine publiée')).toBeInTheDocument()
  })

  it('shows a machine the atelier actually publishes', () => {
    render(<AtelierCard atelier={summaryFixture({ slug: 'la-forge', machineKinds: ['SEWING'] })} />)
    expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute(
      'src',
      expect.stringContaining('kind-sewing')
    )
  })

  it('falls back to a drawn plate when there is no machine to photograph', () => {
    render(<AtelierCard atelier={summaryFixture({ slug: 'la-forge', machineCount: 0, machineKinds: [] })} />)
    expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute(
      'src',
      expect.stringContaining('ateliers%2Fcover-')
    )
  })

  it('shows the distance only when the search carried a position', () => {
    const { rerender } = render(<AtelierCard atelier={summaryFixture({ distanceKm: null })} />)
    expect(screen.queryByText(/km/)).not.toBeInTheDocument()

    rerender(<AtelierCard atelier={summaryFixture({ distanceKm: 7.42 })} />)
    expect(screen.getByText('à 7,4 km')).toBeInTheDocument()
  })
})
