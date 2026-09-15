import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { idleSettings, settingsRefused, settingsSaved } from '@/modules/identity/core/model/settings'

import type { ProfileFormProps } from './ProfileForm'
import { ProfileForm } from './ProfileForm'

const action = vi.fn()

const PRACTICES = ['Bois', 'Métal', 'Textile']

const renderForm = (overrides: Partial<ProfileFormProps> = {}) =>
  render(
    <ProfileForm
      action={action}
      initialState={idleSettings}
      displayName="Camille Roux"
      practice={['Bois']}
      practices={PRACTICES}
      {...overrides}
    />
  )

describe('ProfileForm', () => {
  it('starts from the name the member already carries', () => {
    renderForm()
    expect(screen.getByLabelText(/nom affiché/i)).toHaveValue('Camille Roux')
  })

  it('ticks the practices already declared, and only those', () => {
    renderForm({ practice: ['Bois', 'Textile'] })
    expect(screen.getByRole('checkbox', { name: 'Bois' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Textile' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Métal' })).not.toBeChecked()
  })

  it('offers every practice of the vocabulary', () => {
    renderForm()
    expect(screen.getAllByRole('checkbox')).toHaveLength(PRACTICES.length)
  })

  it('says nothing before the first save', () => {
    renderForm()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('announces a success as a status', () => {
    renderForm({ initialState: settingsSaved('Profil enregistré.') })
    expect(screen.getByRole('status')).toHaveTextContent('Profil enregistré.')
  })

  it('announces a refusal as an alert', () => {
    renderForm({ initialState: settingsRefused('Déclarez au moins une pratique.') })
    expect(screen.getByRole('alert')).toHaveTextContent('Déclarez au moins une pratique.')
  })
})
