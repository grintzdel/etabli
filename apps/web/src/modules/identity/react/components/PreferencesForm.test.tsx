import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { idleSettings, settingsRefused, settingsSaved } from '@/modules/identity/core/model/settings'

import type { PreferencesFormProps } from './PreferencesForm'
import { PreferencesForm } from './PreferencesForm'

const action = vi.fn()

const ATELIERS = [
  { id: 'atelier-1', name: 'La Forge' },
  { id: 'atelier-2', name: 'Copeaux & Cie' },
]

const renderForm = (overrides: Partial<PreferencesFormProps> = {}) =>
  render(
    <PreferencesForm
      action={action}
      initialState={idleSettings}
      theme="system"
      defaultAtelierId={null}
      ateliers={ATELIERS}
      {...overrides}
    />
  )

describe('PreferencesForm', () => {
  it('checks the theme the member already saved', () => {
    renderForm({ theme: 'light' })
    expect(screen.getByRole('radio', { name: 'Clair' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Sombre' })).not.toBeChecked()
  })

  it('offers only the ateliers the member joined, plus none', () => {
    renderForm()
    const select = screen.getByLabelText(/atelier par défaut/i)
    expect([...select.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'Aucun',
      'La Forge',
      'Copeaux & Cie',
    ])
  })

  it('selects the atelier already preferred', () => {
    renderForm({ defaultAtelierId: 'atelier-2' })
    expect(screen.getByLabelText(/atelier par défaut/i)).toHaveValue('atelier-2')
  })

  it('drops the select when the member joined nothing', () => {
    renderForm({ ateliers: [] })
    expect(screen.queryByLabelText(/atelier par défaut/i)).not.toBeInTheDocument()
    expect(screen.getByText(/rejoignez un atelier/i)).toBeInTheDocument()
  })

  it('says nothing before the first save', () => {
    renderForm()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('announces a success as a status', () => {
    renderForm({ initialState: settingsSaved('Préférences enregistrées.') })
    expect(screen.getByRole('status')).toHaveTextContent('Préférences enregistrées.')
  })

  it('announces a refusal as an alert', () => {
    renderForm({ initialState: settingsRefused("Vous n'êtes pas membre de cet atelier.") })
    expect(screen.getByRole('alert')).toHaveTextContent("Vous n'êtes pas membre de cet atelier.")
  })
})
