import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { SessionNavProps } from './SessionNav'
import { SessionNav } from './SessionNav'

const signOut = vi.fn()

const renderNav = (overrides: Partial<SessionNavProps> = {}) =>
  render(
    <SessionNav
      displayName="Camille Roux"
      isPlatformAdmin={false}
      isFabmanager={false}
      defaultAtelier={null}
      signOut={signOut}
      {...overrides}
    />
  )

describe('SessionNav', () => {
  it('links to the account under the display name', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Camille Roux' })).toHaveAttribute('href', '/compte')
  })

  it('offers the settings to every signed-in member', () => {
    renderNav()
    expect(screen.getByRole('link', { name: /paramètres/i })).toHaveAttribute('href', '/parametres')
  })

  it('hides the administration from a plain member', () => {
    renderNav()
    expect(screen.queryByRole('link', { name: /administration/i })).not.toBeInTheDocument()
  })

  it('offers the bookings to every signed-in member', () => {
    renderNav()
    expect(screen.getByRole('link', { name: /réservations/i })).toHaveAttribute('href', '/reservations')
  })

  it('offers the habilitations to every signed-in member', () => {
    renderNav()
    expect(screen.getByRole('link', { name: /habilitations/i })).toHaveAttribute('href', '/habilitations')
  })

  it('hides the parc and the review queue from someone who fabmanages nothing', () => {
    renderNav()
    expect(screen.queryByRole('link', { name: /^machines$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^file$/i })).not.toBeInTheDocument()
  })

  it('offers the parc and the review queue to a fabmanager', () => {
    renderNav({ isFabmanager: true })
    expect(screen.getByRole('link', { name: /^machines$/i })).toHaveAttribute('href', '/manage/machines')
    expect(screen.getByRole('link', { name: /^file$/i })).toHaveAttribute('href', '/manage/certifications')
  })

  it('offers the administration to a platform admin', () => {
    renderNav({ isPlatformAdmin: true })
    expect(screen.getByRole('link', { name: /administration/i })).toHaveAttribute('href', '/admin/ateliers')
  })

  it('carries no shortcut when no atelier is preferred', () => {
    renderNav()
    expect(screen.queryByRole('link', { name: /la forge/i })).not.toBeInTheDocument()
  })

  it('shortcuts to the preferred atelier when one is chosen', () => {
    renderNav({ defaultAtelier: { slug: 'la-forge', name: 'La Forge' } })
    expect(screen.getByRole('link', { name: 'La Forge' })).toHaveAttribute('href', '/ateliers/la-forge')
  })
})
