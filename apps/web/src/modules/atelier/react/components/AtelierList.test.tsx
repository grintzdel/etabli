import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { summaryFixture } from '@/modules/atelier/__tests__/atelier.factory'

import { AtelierList } from './AtelierList'

describe('AtelierList', () => {
  it('announces an empty result instead of showing a blank page', () => {
    render(<AtelierList ateliers={[]} />)
    expect(screen.getByRole('status')).toHaveTextContent(/aucun atelier/i)
  })

  it('lets the caller say why nothing is listed', () => {
    render(<AtelierList ateliers={[]} emptyMessage="Aucun atelier dans cette zone." />)
    expect(screen.getByRole('status')).toHaveTextContent('Aucun atelier dans cette zone.')
  })

  it('gives one list item per atelier', () => {
    render(<AtelierList ateliers={[summaryFixture(), summaryFixture()]} />)
    expect(screen.getByRole('list', { name: 'Ateliers' }).children).toHaveLength(2)
  })
})
