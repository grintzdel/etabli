'use client'

import { useActionState } from 'react'

import type { AuthFormAction, AuthFormState } from '@/modules/identity/core/model/session'
import { PASSWORD_MIN_LENGTH } from '@/modules/identity/core/model/session'
import { Button } from '@/ui/Button'
import { TextField } from '@/ui/TextField'

import { AuthFormError } from './AuthFormError'

export interface RegisterFormProps {
  readonly action: AuthFormAction
  readonly initialState: AuthFormState
}

export const RegisterForm = ({ action, initialState }: RegisterFormProps) => {
  const [state, submit, pending] = useActionState(action, initialState)

  return (
    <form action={submit} className="flex flex-col gap-5">
      <TextField
        label="Nom affiché"
        name="displayName"
        autoComplete="name"
        required
        defaultValue={state.displayName}
        invalid={state.error !== null}
      />
      <TextField
        label="Adresse e-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.email}
        invalid={state.error !== null}
      />
      <TextField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        required
        invalid={state.error !== null}
      />
      <AuthFormError message={state.error} />
      <Button type="submit" disabled={pending}>
        {pending ? 'Création…' : 'Créer mon compte'}
      </Button>
    </form>
  )
}
