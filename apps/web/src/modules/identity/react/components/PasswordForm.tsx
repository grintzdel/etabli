'use client'

import { useActionState } from 'react'

import { PASSWORD_MIN_LENGTH } from '@/modules/identity/core/model/session'
import type { SettingsFormAction, SettingsFormState } from '@/modules/identity/core/model/settings'
import { Button } from '@/ui/Button'
import { TextField } from '@/ui/TextField'

import { SettingsFeedback } from './SettingsFeedback'

export type PasswordFormProps = {
  readonly action: SettingsFormAction
  readonly initialState: SettingsFormState
}

export const PasswordForm = ({ action, initialState }: PasswordFormProps) => {
  const [state, submit, pending] = useActionState(action, initialState)

  return (
    <form action={submit} className="flex flex-col gap-5">
      <TextField
        label="Mot de passe actuel"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
      />
      <TextField
        label="Nouveau mot de passe"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        required
      />
      <TextField
        label="Confirmer le nouveau mot de passe"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        required
      />

      <p className="text-graphite-400 text-sm">
        Vous restez connecté ici. Vos autres appareils le restent aussi jusqu’à l’expiration de leur session.
      </p>

      <SettingsFeedback state={state} />

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Changer le mot de passe'}
        </Button>
      </div>
    </form>
  )
}
