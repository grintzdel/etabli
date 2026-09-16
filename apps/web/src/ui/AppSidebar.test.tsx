import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AppSidebar, SidebarLink, SidebarSection } from './AppSidebar'

describe('AppSidebar', () => {
  it('is the banner of the member space, not a tangential aside', () => {
    render(<AppSidebar nav={null} />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('takes the wordmark back to the dashboard', () => {
    render(<AppSidebar nav={null} />)

    expect(screen.getByRole('link', { name: 'Établi' })).toHaveAttribute('href', '/tableau-de-bord')
  })

  it('holds whatever navigation it is given, under one landmark', () => {
    render(
      <AppSidebar
        nav={
          <SidebarSection title="Espace membre">
            <SidebarLink href="/reservations">Réservations</SidebarLink>
          </SidebarSection>
        }
      />
    )

    const nav = screen.getByRole('navigation', { name: /espace membre/i })
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Réservations' }))
  })

  it('titles each section so the groups are readable', () => {
    render(<AppSidebar nav={<SidebarSection title="Plateforme">{null}</SidebarSection>} />)

    expect(screen.getByRole('heading', { name: 'Plateforme' })).toBeInTheDocument()
  })
})
