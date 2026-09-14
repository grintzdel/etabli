import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SessionNav } from './SessionNav'

const signOut = vi.fn()

describe('SessionNav', () => {
  it('links to the account under the display name', () => {
    render(<SessionNav displayName="Camille Roux" isPlatformAdmin={false} signOut={signOut} />)
    expect(screen.getByRole('link', { name: 'Camille Roux' })).toHaveAttribute('href', '/compte')
  })

  it('hides the administration from a plain member', () => {
    render(<SessionNav displayName="Camille Roux" isPlatformAdmin={false} signOut={signOut} />)
    expect(screen.queryByRole('link', { name: /administration/i })).not.toBeInTheDocument()
  })

  it('offers the administration to a platform admin', () => {
    render(<SessionNav displayName="Camille Roux" isPlatformAdmin signOut={signOut} />)
    expect(screen.getByRole('link', { name: /administration/i })).toHaveAttribute('href', '/admin/ateliers')
  })
})
