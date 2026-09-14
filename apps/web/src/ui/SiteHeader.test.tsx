import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SignedOutLinks, SiteHeader } from './SiteHeader'

describe('SiteHeader', () => {
  it('always offers the directory and the account', () => {
    render(<SiteHeader session={null} />)
    const nav = screen.getByRole('navigation', { name: /principale/i })

    expect(nav).toContainElement(screen.getByRole('link', { name: 'Ateliers' }))
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Mon compte' }))
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
