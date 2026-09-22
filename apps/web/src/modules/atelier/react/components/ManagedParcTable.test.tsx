import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { managedMachineFixture } from '@/modules/atelier/__tests__/atelier.factory'
import { idleCheckInToken } from '@/modules/atelier/core/model/check-in-token-form'

import { ManagedParcTable } from './ManagedParcTable'

const noop = vi.fn()
const checkInTokenAction = vi.fn().mockResolvedValue(idleCheckInToken)

describe('ManagedParcTable', () => {
  it('says so when the atelier has no machine yet', () => {
    render(<ManagedParcTable machines={[]} action={noop} checkInTokenAction={checkInTokenAction} />)
    expect(screen.getByText(/aucune machine/i)).toBeInTheDocument()
  })

  it('gives one row per machine, headed by its name', () => {
    render(
      <ManagedParcTable
        machines={[managedMachineFixture({ name: 'Trotec' }), managedMachineFixture({ name: 'Prusa' })]}
        action={noop}
        checkInTokenAction={checkInTokenAction}
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
        checkInTokenAction={checkInTokenAction}
      />
    )
    expect(screen.getByText('90 min')).toBeInTheDocument()
    expect(screen.getByText('Libre')).toBeInTheDocument()
  })

  it('offers maintenance and retirement on an available machine', () => {
    render(
      <ManagedParcTable
        machines={[managedMachineFixture({ status: 'AVAILABLE' })]}
        action={noop}
        checkInTokenAction={checkInTokenAction}
      />
    )
    expect(screen.getByRole('button', { name: /en maintenance/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retirer/i })).toBeInTheDocument()
  })

  it('offers to put a machine under maintenance back in service', () => {
    render(
      <ManagedParcTable
        machines={[managedMachineFixture({ status: 'MAINTENANCE' })]}
        action={noop}
        checkInTokenAction={checkInTokenAction}
      />
    )
    expect(screen.getByRole('button', { name: /remettre en service/i })).toBeInTheDocument()
  })

  it('leaves a retired machine only one way back', () => {
    render(
      <ManagedParcTable
        machines={[managedMachineFixture({ status: 'RETIRED' })]}
        action={noop}
        checkInTokenAction={checkInTokenAction}
      />
    )
    expect(screen.getByRole('button', { name: /remettre en service/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /retirer/i })).not.toBeInTheDocument()
  })

  it('carries the machine id and the target status in the submitted form', () => {
    const { container } = render(
      <ManagedParcTable
        machines={[managedMachineFixture({ id: 'abc', status: 'AVAILABLE' })]}
        action={noop}
        checkInTokenAction={checkInTokenAction}
      />
    )
    expect(container.querySelector('input[name="machineId"]')).toHaveValue('abc')
  })
})

describe('ManagedParcTable · QR de pointage', () => {
  it('offers a print link that carries the machine name', () => {
    render(
      <ManagedParcTable
        machines={[managedMachineFixture({ id: 'machine-1', name: 'Trotec' })]}
        action={noop}
        checkInTokenAction={checkInTokenAction}
      />
    )

    expect(screen.getByRole('link', { name: /imprimer le qr — trotec/i })).toHaveAttribute(
      'href',
      '/manage/machines/machine-1/qr'
    )
  })

  it('offers a regenerate button per machine', () => {
    render(
      <ManagedParcTable
        machines={[managedMachineFixture({ name: 'Prusa' })]}
        action={noop}
        checkInTokenAction={checkInTokenAction}
      />
    )

    expect(screen.getByRole('button', { name: /régénérer — prusa/i })).toBeInTheDocument()
  })

  it('never prints the token itself in the parc', () => {
    render(
      <ManagedParcTable
        machines={[managedMachineFixture({ name: 'Prusa', checkInToken: 'qr-secret-01' })]}
        action={noop}
        checkInTokenAction={checkInTokenAction}
      />
    )

    expect(screen.queryByText(/qr-secret-01/)).not.toBeInTheDocument()
  })
})
