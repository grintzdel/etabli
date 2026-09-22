import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { SESSION_COOKIE } from '@/modules/identity/core/model/session'

export const readSessionToken = async (): Promise<string | null> => {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}

export const hasSession = async (): Promise<boolean> => (await readSessionToken()) !== null

export const requireSession = async (next: string): Promise<void> => {
  if (!(await hasSession())) redirect(`/connexion?next=${next}`)
}

export const writeSessionCookie = async (token: string, expiresAt: string): Promise<void> => {
  const store = await cookies()
  const maxAge = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge,
  })
}

export const clearSessionCookie = async (): Promise<void> => {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
