import { cookies } from 'next/headers'

import { SESSION_COOKIE } from '@/modules/identity/core/model/session'

export const readSessionToken = async (): Promise<string | null> => {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
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
