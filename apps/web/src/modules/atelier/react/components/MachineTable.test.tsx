import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { machineFixture } from '@/modules/atelier/__tests__/atelier.factory'

import { MachineTable } from './MachineTable'

describe('MachineTable', () => {
  it('says so when the parc is empty', () => {
    render(<MachineTable machines={[]} />)
    expect(screen.getByText(/pas encore publié son parc/i)).toBeInTheDocument()
  })

  it('gives one row per machine, headed by its name', () => {
    render(<MachineTable machines={[machineFixture({ name: 'Trotec' }), machineFixture({ name: 'Prusa' })]} />)
    expect(screen.getByRole('rowheader', { name: /Trotec/ })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: /Prusa/ })).toBeInTheDocument()
  })

  it('marks a machine under maintenance without hiding it', () => {
    render(<MachineTable machines={[machineFixture({ name: 'Prusa', status: 'MAINTENANCE' })]} />)
    expect(screen.getByRole('rowheader', { name: /Prusa/ })).toBeInTheDocument()
    expect(screen.getByText('En maintenance')).toBeInTheDocument()
  })

  it('states whether a certification is required', () => {
    render(
      <MachineTable
        machines={[machineFixture({ requiresCertification: true }), machineFixture({ requiresCertification: false })]}
      />
    )
    expect(screen.getByText('Requise')).toBeInTheDocument()
    expect(screen.getByText('Libre')).toBeInTheDocument()
  })

  it('shows the slot granularity', () => {
    render(<MachineTable machines={[machineFixture({ slotDurationMinutes: 30 })]} />)
    expect(screen.getByText('30 min')).toBeInTheDocument()
  })
})
