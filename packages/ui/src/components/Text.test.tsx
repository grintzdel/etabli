import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Text } from './Text'

describe('Text', () => {
  it('renders a span by default', () => {
    render(<Text>Atelier</Text>)
    expect(screen.getByText('Atelier').tagName).toBe('SPAN')
  })

  it('renders the requested element', () => {
    render(<Text as="h1">Atelier</Text>)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Atelier')
  })

  it('uses the display face on the title variant', () => {
    render(<Text variant="title">Atelier</Text>)
    expect(screen.getByText('Atelier')).toHaveClass('font-display')
  })

  it('uses a distinct class per tone', () => {
    const { rerender } = render(<Text tone="muted">Atelier</Text>)
    const muted = screen.getByText('Atelier').className

    rerender(<Text tone="accent">Atelier</Text>)

    expect(screen.getByText('Atelier').className).not.toBe(muted)
  })

  it('merges a caller className', () => {
    render(<Text className="mt-4">Atelier</Text>)
    expect(screen.getByText('Atelier')).toHaveClass('mt-4')
  })
})
