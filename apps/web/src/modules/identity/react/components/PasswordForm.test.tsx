import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PASSWORD_MIN_LENGTH } from '@/modules/identity/core/model/session'
import { idleSettings, settingsRefused, settingsSaved } from '@/modules/identity/core/model/settings'

import type { PasswordFormProps } from './PasswordForm'
import { PasswordForm } from './PasswordForm'

const action = vi.fn()

const renderForm = (overrides: Partial<PasswordFormProps> = {}) =>
  render(<PasswordForm action={action} initialState={idleSettings} {...overrides} />)

describe('PasswordForm', () => {
  it('asks for the current password before the new one', () => {
    renderForm()
    expect(screen.getByLabelText(/mot de passe actuel/i)).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText(/^nouveau mot de passe$/i)).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText(/confirmer/i)).toHaveAttribute('type', 'password')
  })

  it('carries the minimum length on both new-password fields', () => {
    renderForm()
    expect(screen.getByLabelText(/^nouveau mot de passe$/i)).toHaveAttribute('minlength', String(PASSWORD_MIN_LENGTH))
    expect(screen.getByLabelText(/confirmer/i)).toHaveAttribute('minlength', String(PASSWORD_MIN_LENGTH))
  })

  it('tells the member the other devices stay signed in', () => {
    renderForm()
    expect(screen.getByText(/autres appareils/i)).toBeInTheDocument()
  })

  it('says nothing before the first attempt', () => {
    renderForm()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('announces a success as a status', () => {
    renderForm({ initialState: settingsSaved('Mot de passe changé.') })
    expect(screen.getByRole('status')).toHaveTextContent('Mot de passe changé.')
  })

  it('announces a refusal as an alert', () => {
    renderForm({ initialState: settingsRefused('Le mot de passe actuel est incorrect.') })
    expect(screen.getByRole('alert')).toHaveTextContent('Le mot de passe actuel est incorrect.')
  })
})
