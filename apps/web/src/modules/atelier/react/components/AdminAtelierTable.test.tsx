import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { adminAtelierFixture } from '@/modules/atelier/__tests__/atelier.factory'

import { AdminAtelierTable } from './AdminAtelierTable'

const noop = vi.fn()

describe('AdminAtelierTable', () => {
  it('says so when no atelier exists yet', () => {
    render(<AdminAtelierTable ateliers={[]} action={noop} />)
    expect(screen.getByText(/aucun atelier/i)).toBeInTheDocument()
  })

  it('shows the url slug next to the name, since that is what the public link carries', () => {
    render(<AdminAtelierTable ateliers={[adminAtelierFixture({ name: 'La Forge', slug: 'la-forge' })]} action={noop} />)
    expect(screen.getByText('/la-forge')).toBeInTheDocument()
  })

  it('offers to publish a draft', () => {
    render(<AdminAtelierTable ateliers={[adminAtelierFixture({ status: 'DRAFT' })]} action={noop} />)
    expect(screen.getByRole('button', { name: /publier/i })).toBeInTheDocument()
    expect(screen.getByText('Brouillon')).toBeInTheDocument()
  })

  it('offers to close a published atelier', () => {
    render(<AdminAtelierTable ateliers={[adminAtelierFixture({ status: 'PUBLISHED' })]} action={noop} />)
    expect(screen.getByRole('button', { name: /fermer/i })).toBeInTheDocument()
  })

  it('offers to reopen a closed one', () => {
    render(<AdminAtelierTable ateliers={[adminAtelierFixture({ status: 'CLOSED' })]} action={noop} />)
    expect(screen.getByRole('button', { name: /rouvrir/i })).toBeInTheDocument()
  })

  it('carries the atelier id and the target status in the submitted form', () => {
    const { container } = render(
      <AdminAtelierTable ateliers={[adminAtelierFixture({ id: 'abc', status: 'DRAFT' })]} action={noop} />
    )

    expect(container.querySelector('input[name="atelierId"]')).toHaveValue('abc')
    expect(container.querySelector('input[name="status"]')).toHaveValue('PUBLISHED')
  })
})
