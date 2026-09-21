import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MachineAccessNotice } from './MachineAccessNotice'

describe('MachineAccessNotice', () => {
  it('sends a visitor to sign in, and back to the machine afterwards', () => {
    render(
      <MachineAccessNotice
        signedIn={false}
        atelierName="Atelier des Canuts"
        atelierSlug="atelier-des-canuts"
        machineId="0a7e1f00-0000-4000-8000-000000000501"
      />
    )

    expect(screen.getByRole('link', { name: /se connecter/i })).toHaveAttribute(
      'href',
      '/connexion?next=%2Fmachines%2F0a7e1f00-0000-4000-8000-000000000501'
    )
  })

  it('names the atelier a signed-in outsider has to join', () => {
    render(
      <MachineAccessNotice
        signedIn
        atelierName="Atelier des Canuts"
        atelierSlug="atelier-des-canuts"
        machineId="0a7e1f00-0000-4000-8000-000000000501"
      />
    )

    expect(screen.getByText(/atelier des canuts/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /voir l’atelier/i })).toHaveAttribute(
      'href',
      '/ateliers/atelier-des-canuts'
    )
  })

  it('never offers the sign-in link to someone already signed in', () => {
    render(
      <MachineAccessNotice signedIn atelierName="Atelier des Canuts" atelierSlug="atelier-des-canuts" machineId="m-1" />
    )

    expect(screen.queryByRole('link', { name: /se connecter/i })).not.toBeInTheDocument()
  })
})
