import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Réserver</Button>)
    expect(screen.getByRole('button', { name: /réserver/i })).toBeInTheDocument()
  })

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Réserver</Button>)

    await userEvent.click(screen.getByRole('button', { name: /réserver/i }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Réserver
      </Button>
    )

    await userEvent.click(screen.getByRole('button', { name: /réserver/i }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('carries the signal accent on the primary variant', () => {
    render(<Button>Réserver</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-signal-500')
  })

  it('does not carry the signal accent on the ghost variant', () => {
    render(<Button variant="ghost">Annuler</Button>)
    expect(screen.getByRole('button')).not.toHaveClass('bg-signal-500')
  })

  it('merges a caller className', () => {
    render(<Button className="w-full">Réserver</Button>)
    expect(screen.getByRole('button')).toHaveClass('w-full')
  })

  it('defaults to type button', () => {
    render(<Button>Réserver</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
})
