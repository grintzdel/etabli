import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { myCertificationFixture } from '@/modules/certification/__tests__/certification.factory'

import { MyCertificationsTable } from './MyCertificationsTable'

const noop = vi.fn()

describe('MyCertificationsTable', () => {
  it('says so when no machine of the member’s ateliers needs an habilitation', () => {
    render(<MyCertificationsTable certifications={[]} action={noop} />)
    expect(screen.getByText(/aucune machine de vos ateliers/i)).toBeInTheDocument()
  })

  it('offers to ask on a machine never requested', () => {
    render(<MyCertificationsTable certifications={[myCertificationFixture({ status: 'NONE' })]} action={noop} />)
    expect(screen.getByRole('button', { name: /demander/i })).toBeInTheDocument()
    expect(screen.getByText('Non demandée')).toBeInTheDocument()
  })

  it('offers to ask again after a refusal', () => {
    render(<MyCertificationsTable certifications={[myCertificationFixture({ status: 'REVOKED' })]} action={noop} />)
    expect(screen.getByRole('button', { name: /demander/i })).toBeInTheDocument()
  })

  it('offers nothing while a request is pending', () => {
    render(<MyCertificationsTable certifications={[myCertificationFixture({ status: 'PENDING' })]} action={noop} />)
    expect(screen.queryByRole('button', { name: /demander/i })).not.toBeInTheDocument()
    expect(screen.getByText('En attente')).toBeInTheDocument()
  })

  it('offers nothing once the habilitation is granted', () => {
    render(<MyCertificationsTable certifications={[myCertificationFixture({ status: 'GRANTED' })]} action={noop} />)
    expect(screen.queryByRole('button', { name: /demander/i })).not.toBeInTheDocument()
    expect(screen.getByText('Habilité')).toBeInTheDocument()
  })

  it('carries the machine id in the submitted form', () => {
    const { container } = render(
      <MyCertificationsTable certifications={[myCertificationFixture({ machineId: 'abc' })]} action={noop} />
    )
    expect(container.querySelector('input[name="machineId"]')).toHaveValue('abc')
  })
})
