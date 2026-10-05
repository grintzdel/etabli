import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SlotGate, type SlotGateProps } from './SlotGate'

const returnTo = '/machines/m-1?creneau=2026-10-06T06%3A00%3A00.000Z'

const renderGate = (eligibility: SlotGateProps['eligibility']) =>
  render(
    <SlotGate
      eligibility={eligibility}
      machineId="m-1"
      atelierName="Atelier des Canuts"
      atelierSlug="atelier-des-canuts"
      returnTo={returnTo}
      requestCertification={vi.fn()}
    />
  )

describe('SlotGate', () => {
  it('sends a visitor to sign in or sign up, and back to the chosen slot afterwards', () => {
    renderGate('ANONYMOUS')

    const next = encodeURIComponent(returnTo)
    expect(screen.getByRole('link', { name: /se connecter pour réserver/i })).toHaveAttribute(
      'href',
      `/connexion?next=${next}`
    )
    expect(screen.getByRole('link', { name: /créer un compte/i })).toHaveAttribute('href', `/inscription?next=${next}`)
  })

  it('sends an outsider to join this very atelier, then back to the slot', () => {
    renderGate('NOT_MEMBER')

    expect(screen.getByRole('link', { name: /rejoindre atelier des canuts/i })).toHaveAttribute(
      'href',
      `/bienvenue?atelier=atelier-des-canuts&next=${encodeURIComponent(returnTo)}`
    )
  })

  it('offers to request the certification instead of a booking that would be refused', () => {
    renderGate('CERTIFICATION_REQUIRED')

    expect(screen.getByRole('button', { name: /demander l’habilitation/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /réserver/i })).not.toBeInTheDocument()
  })

  it('tells a member whose request is pending that a fabmanager has to decide', () => {
    renderGate('CERTIFICATION_PENDING')

    expect(screen.getByText(/attend la décision d’un fabmanager/i)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
