'use server'

import { redirect } from 'next/navigation'

import type { AuthFormState } from '@/modules/identity/core/model/session'

import { identityPort } from './container'
import { clearSessionCookie, writeSessionCookie } from './session'

const text = (formData: FormData, name: string): string => {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

const safeNext = (candidate: string): string =>
  candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : '/compte'

export const registerAction = async (_previous: AuthFormState, formData: FormData): Promise<AuthFormState> => {
  const email = text(formData, 'email')
  const displayName = text(formData, 'displayName')

  const result = await identityPort.register({ email, displayName, password: text(formData, 'password') })
  if (!result.ok) return { error: result.error.message, email, displayName }

  await writeSessionCookie(result.value.token, result.value.expiresAt)
  redirect('/bienvenue')
}

export const loginAction = async (_previous: AuthFormState, formData: FormData): Promise<AuthFormState> => {
  const email = text(formData, 'email')

  const result = await identityPort.login({ email, password: text(formData, 'password') })
  if (!result.ok) return { error: result.error.message, email, displayName: '' }

  await writeSessionCookie(result.value.token, result.value.expiresAt)
  redirect(safeNext(text(formData, 'next')))
}

export const logoutAction = async (): Promise<void> => {
  await clearSessionCookie()
  redirect('/connexion')
}
