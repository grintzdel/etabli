'use client'

import { Button, TextField } from '@etabli/ui'
import { useActionState } from 'react'

import type { AuthFormAction, AuthFormState } from '@/modules/identity/core/model/session'

import { AuthFormError } from './AuthFormError'

export interface LoginFormProps {
  readonly action: AuthFormAction
  readonly initialState: AuthFormState
  readonly next?: string
}

export const LoginForm = ({ action, initialState, next }: LoginFormProps) => {
  const [state, submit, pending] = useActionState(action, initialState)

  return (
    <form action={submit} className="flex flex-col gap-5">
      {next === undefined ? null : <input type="hidden" name="next" value={next} />}
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
        autoComplete="current-password"
        required
        invalid={state.error !== null}
      />
      <AuthFormError message={state.error} />
      <Button type="submit" disabled={pending}>
        {pending ? 'Connexion…' : 'Se connecter'}
      </Button>
    </form>
  )
}
