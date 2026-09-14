import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { managedMachineFixture } from '@/modules/atelier/__tests__/atelier.factory'

import { ManagedParcTable } from './ManagedParcTable'

const noop = vi.fn()

describe('ManagedParcTable', () => {
  it('says so when the atelier has no machine yet', () => {
    render(<ManagedParcTable machines={[]} action={noop} />)
    expect(screen.getByText(/aucune machine/i)).toBeInTheDocument()
  })

  it('gives one row per machine, headed by its name', () => {
    render(
      <ManagedParcTable
        machines={[managedMachineFixture({ name: 'Trotec' }), managedMachineFixture({ name: 'Prusa' })]}
        action={noop}
      />
    )
    expect(screen.getByRole('rowheader', { name: /Trotec/ })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: /Prusa/ })).toBeInTheDocument()
  })

  it('states the slot and whether an habilitation is required', () => {
    render(
      <ManagedParcTable
        machines={[managedMachineFixture({ slotDurationMinutes: 90, requiresCertification: false })]}
        action={noop}
      />
    )
    expect(screen.getByText('90 min')).toBeInTheDocument()
    expect(screen.getByText('Libre')).toBeInTheDocument()
  })

  it('offers maintenance and retirement on an available machine', () => {
    render(<ManagedParcTable machines={[managedMachineFixture({ status: 'AVAILABLE' })]} action={noop} />)
    expect(screen.getByRole('button', { name: /en maintenance/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retirer/i })).toBeInTheDocument()
  })

  it('offers to put a machine under maintenance back in service', () => {
    render(<ManagedParcTable machines={[managedMachineFixture({ status: 'MAINTENANCE' })]} action={noop} />)
    expect(screen.getByRole('button', { name: /remettre en service/i })).toBeInTheDocument()
  })

  it('leaves a retired machine only one way back', () => {
    render(<ManagedParcTable machines={[managedMachineFixture({ status: 'RETIRED' })]} action={noop} />)
    expect(screen.getByRole('button', { name: /remettre en service/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /retirer/i })).not.toBeInTheDocument()
  })

  it('carries the machine id and the target status in the submitted form', () => {
    const { container } = render(
      <ManagedParcTable machines={[managedMachineFixture({ id: 'abc', status: 'AVAILABLE' })]} action={noop} />
    )
    expect(container.querySelector('input[name="machineId"]')).toHaveValue('abc')
  })
})
