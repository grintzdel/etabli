import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AtelierDirectoryFilters } from './AtelierDirectoryFilters'

describe('AtelierDirectoryFilters', () => {
  it('submits through the URL so a filtered directory stays shareable', () => {
    render(<AtelierDirectoryFilters filters={{}} />)
    expect(screen.getByRole('form', { name: /filtrer/i })).toHaveAttribute('method', 'get')
  })

  it('reflects the filters currently applied', () => {
    render(<AtelierDirectoryFilters filters={{ city: 'Lyon', machineKind: 'SEWING' }} />)
    expect(screen.getByLabelText(/ville/i)).toHaveValue('Lyon')
    expect(screen.getByLabelText(/type de machine/i)).toHaveValue('SEWING')
  })

  it('offers every published kind plus an all-kinds option', () => {
    render(<AtelierDirectoryFilters filters={{}} />)
    expect(screen.getByLabelText(/type de machine/i).children).toHaveLength(7)
  })
})
