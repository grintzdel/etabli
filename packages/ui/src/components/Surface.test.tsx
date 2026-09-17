import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Surface } from './Surface'

describe('Surface', () => {
  it('renders its children', () => {
    render(<Surface>Créneau réservé</Surface>)
    expect(screen.getByText('Créneau réservé')).toBeInTheDocument()
  })

  it('merges a caller className over the default padding', () => {
    render(<Surface className="p-0">Créneau réservé</Surface>)
    expect(screen.getByText('Créneau réservé')).toHaveClass('p-0')
    expect(screen.getByText('Créneau réservé')).not.toHaveClass('p-6')
  })
})
