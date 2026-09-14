import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SessionNav } from './SessionNav'

const signOut = vi.fn()

describe('SessionNav', () => {
  it('links to the account under the display name', () => {
    render(<SessionNav displayName="Camille Roux" isPlatformAdmin={false} isFabmanager={false} signOut={signOut} />)
    expect(screen.getByRole('link', { name: 'Camille Roux' })).toHaveAttribute('href', '/compte')
  })

  it('hides the administration from a plain member', () => {
    render(<SessionNav displayName="Camille Roux" isPlatformAdmin={false} isFabmanager={false} signOut={signOut} />)
    expect(screen.queryByRole('link', { name: /administration/i })).not.toBeInTheDocument()
  })

  it('hides the parc from someone who fabmanages nothing', () => {
    render(<SessionNav displayName="Camille Roux" isPlatformAdmin={false} isFabmanager={false} signOut={signOut} />)
    expect(screen.queryByRole('link', { name: /machines/i })).not.toBeInTheDocument()
  })

  it('offers the parc to a fabmanager', () => {
    render(<SessionNav displayName="Camille Roux" isPlatformAdmin={false} isFabmanager signOut={signOut} />)
    expect(screen.getByRole('link', { name: /machines/i })).toHaveAttribute('href', '/manage/machines')
  })

  it('offers the administration to a platform admin', () => {
    render(<SessionNav displayName="Camille Roux" isPlatformAdmin isFabmanager={false} signOut={signOut} />)
    expect(screen.getByRole('link', { name: /administration/i })).toHaveAttribute('href', '/admin/ateliers')
  })
})
