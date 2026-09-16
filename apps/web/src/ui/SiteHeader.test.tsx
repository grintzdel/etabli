import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SignedInShortcut, SignedOutLinks, SiteHeader } from './SiteHeader'

describe('SiteHeader', () => {
  it('navigates the public surface only', () => {
    render(<SiteHeader session={null} />)
    const nav = screen.getByRole('navigation', { name: /principale/i })

    expect(nav).toContainElement(screen.getByRole('link', { name: 'Ateliers' }))
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Fonctionnalités' }))
    expect(nav).toContainElement(screen.getByRole('link', { name: 'FAQ' }))
  })

  it('keeps the member space out of the public navigation', () => {
    render(<SiteHeader session={null} />)

    expect(screen.queryByRole('link', { name: 'Mon compte' })).not.toBeInTheDocument()
  })

  it('renders whatever session slot it is given', () => {
    render(<SiteHeader session={<span>Camille Roux</span>} />)
    expect(screen.getByText('Camille Roux')).toBeInTheDocument()
  })
})

describe('SignedOutLinks', () => {
  it('offers both ways in', () => {
    render(<SignedOutLinks />)
    expect(screen.getByRole('link', { name: /se connecter/i })).toHaveAttribute('href', '/connexion')
    expect(screen.getByRole('link', { name: /créer un compte/i })).toHaveAttribute('href', '/inscription')
  })
})

describe('SignedInShortcut', () => {
  it('sends a signed-in visitor back to their dashboard', () => {
    render(<SignedInShortcut displayName="Camille Roux" />)

    expect(screen.getByRole('link', { name: /tableau de bord/i })).toHaveAttribute('href', '/tableau-de-bord')
    expect(screen.getByText('Camille Roux')).toBeInTheDocument()
  })
})
