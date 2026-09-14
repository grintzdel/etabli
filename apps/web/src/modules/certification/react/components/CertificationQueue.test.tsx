import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { certificationRequestFixture } from '@/modules/certification/__tests__/certification.factory'

import { CertificationQueue } from './CertificationQueue'

const noop = vi.fn()

const renderQueue = (requests: Parameters<typeof CertificationQueue>[0]['requests']) =>
  render(<CertificationQueue requests={requests} grant={noop} revoke={noop} />)

describe('CertificationQueue', () => {
  it('says so when nothing is waiting', () => {
    renderQueue([])
    expect(screen.getByText(/aucune demande/i)).toBeInTheDocument()
  })

  it('names who asks for which machine', () => {
    renderQueue([certificationRequestFixture({ memberName: 'Camille Roux', machineName: 'Trotec' })])
    expect(screen.getByRole('rowheader', { name: 'Camille Roux' })).toBeInTheDocument()
    expect(screen.getByText('Trotec')).toBeInTheDocument()
  })

  it('offers both decisions on a pending request', () => {
    renderQueue([certificationRequestFixture({ status: 'PENDING' })])
    expect(screen.getByRole('button', { name: /accorder/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /révoquer/i })).toBeInTheDocument()
  })

  it('leaves only the revocation on a granted one', () => {
    renderQueue([certificationRequestFixture({ status: 'GRANTED' })])
    expect(screen.queryByRole('button', { name: /accorder/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /révoquer/i })).toBeInTheDocument()
  })

  it('leaves only the grant on a revoked one', () => {
    renderQueue([certificationRequestFixture({ status: 'REVOKED' })])
    expect(screen.getByRole('button', { name: /accorder/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /révoquer/i })).not.toBeInTheDocument()
  })

  it('carries the certification id in the submitted form', () => {
    const { container } = render(
      <CertificationQueue requests={[certificationRequestFixture({ id: 'abc' })]} grant={noop} revoke={noop} />
    )
    expect(container.querySelector('input[name="certificationId"]')).toHaveValue('abc')
  })
})
