import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders its label', () => {
    render(<StatusBadge tone="ok" label="Disponible" />)
    expect(screen.getByText('Disponible')).toBeInTheDocument()
  })

  it('exposes the status to assistive technology', () => {
    render(<StatusBadge tone="warn" label="En maintenance" />)
    expect(screen.getByRole('status')).toHaveTextContent('En maintenance')
  })

  it('uses a distinct class per tone', () => {
    const { rerender } = render(<StatusBadge tone="ok" label="Disponible" />)
    const ok = screen.getByRole('status').className

    rerender(<StatusBadge tone="danger" label="Retirée" />)
    const danger = screen.getByRole('status').className

    expect(ok).not.toBe(danger)
  })
})
