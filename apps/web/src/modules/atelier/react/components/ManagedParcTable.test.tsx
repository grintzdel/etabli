import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { managedMachineFixture } from '@/modules/atelier/__tests__/atelier.factory'
import { idleNfcTag } from '@/modules/atelier/core/model/nfc-tag-form'

import { ManagedParcTable } from './ManagedParcTable'

const noop = vi.fn()
const nfcTagAction = vi.fn().mockResolvedValue(idleNfcTag)

describe('ManagedParcTable', () => {
  it('says so when the atelier has no machine yet', () => {
    render(<ManagedParcTable machines={[]} action={noop} nfcTagAction={nfcTagAction} />)
    expect(screen.getByText(/aucune machine/i)).toBeInTheDocument()
  })

  it('gives one row per machine, headed by its name', () => {
    render(
      <ManagedParcTable
        machines={[managedMachineFixture({ name: 'Trotec' }), managedMachineFixture({ name: 'Prusa' })]}
        action={noop}
        nfcTagAction={nfcTagAction}
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
        nfcTagAction={nfcTagAction}
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
        nfcTagAction={nfcTagAction}
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
        nfcTagAction={nfcTagAction}
      />
    )
    expect(screen.getByRole('button', { name: /remettre en service/i })).toBeInTheDocument()
  })

  it('leaves a retired machine only one way back', () => {
    render(
      <ManagedParcTable
        machines={[managedMachineFixture({ status: 'RETIRED' })]}
        action={noop}
        nfcTagAction={nfcTagAction}
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
        nfcTagAction={nfcTagAction}
      />
    )
    expect(container.querySelector('input[name="machineId"]')).toHaveValue('abc')
  })
})

describe('ManagedParcTable · tag NFC', () => {
  it('shows the tag a machine already carries', () => {
    render(
      <ManagedParcTable
        machines={[managedMachineFixture({ name: 'Trotec', nfcTagId: 'nfc-trotec-01' })]}
        action={noop}
        nfcTagAction={nfcTagAction}
      />
    )

    expect(screen.getByLabelText(/tag nfc — trotec/i)).toHaveValue('nfc-trotec-01')
  })

  it('leaves the field empty on a machine without a tag', () => {
    render(
      <ManagedParcTable
        machines={[managedMachineFixture({ name: 'Prusa', nfcTagId: null })]}
        action={noop}
        nfcTagAction={nfcTagAction}
      />
    )

    expect(screen.getByLabelText(/tag nfc — prusa/i)).toHaveValue('')
  })
})
