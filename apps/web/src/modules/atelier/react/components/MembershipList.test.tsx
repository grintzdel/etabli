import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { summaryFixture } from '@/modules/atelier/__tests__/atelier.factory'

import { MembershipList } from './MembershipList'

describe('MembershipList', () => {
  it('points an unattached member at the onboarding', () => {
    render(<MembershipList memberships={[]} ateliers={[]} />)
    expect(screen.getByRole('link', { name: /rejoindre un atelier/i })).toHaveAttribute('href', '/bienvenue')
  })

  it('names the atelier and links to its parc', () => {
    const atelier = summaryFixture({ slug: 'la-forge', name: 'La Forge' })
    render(<MembershipList memberships={[{ atelierId: atelier.id, role: 'MEMBER' }]} ateliers={[atelier]} />)

    expect(screen.getByText('La Forge')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /voir le parc/i })).toHaveAttribute('href', '/ateliers/la-forge')
  })

  it('tells a fabmanager apart from a member', () => {
    const atelier = summaryFixture()
    const { rerender } = render(
      <MembershipList memberships={[{ atelierId: atelier.id, role: 'MEMBER' }]} ateliers={[atelier]} />
    )
    expect(screen.getByText('Membre')).toBeInTheDocument()

    rerender(<MembershipList memberships={[{ atelierId: atelier.id, role: 'FABMANAGER' }]} ateliers={[atelier]} />)
    expect(screen.getByText('Fabmanager')).toBeInTheDocument()
  })

  it('still lists a membership whose atelier is not in the directory', () => {
    render(<MembershipList memberships={[{ atelierId: 'inconnu', role: 'MEMBER' }]} ateliers={[]} />)
    expect(screen.getByRole('list', { name: /mes ateliers/i }).children).toHaveLength(1)
    expect(screen.queryByRole('link', { name: /voir le parc/i })).not.toBeInTheDocument()
  })
})
