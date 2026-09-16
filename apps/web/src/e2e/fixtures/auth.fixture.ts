import type { APIRequestContext, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export const apiUrl = process.env.API_URL ?? 'http://localhost:3001'

export const SEED_PASSWORD = 'etabli-2026'

export const signIn = async (page: Page, email: string, password: string = SEED_PASSWORD): Promise<void> => {
  await page.goto('/connexion')
  await page.getByLabel(/adresse e-mail/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill(password)
  await page.getByRole('button', { name: /se connecter/i }).click()
  await expect(page).toHaveURL(/\/(tableau-de-bord|bienvenue)$/)
}

export const tokenOf = async (
  request: APIRequestContext,
  email: string,
  password: string = SEED_PASSWORD
): Promise<string> => {
  const response = await request.post(`${apiUrl}/auth/login`, { data: { email, password } })
  expect(response.status()).toBe(200)

  const session = (await response.json()) as { readonly token: string }
  return session.token
}

export const freshMember = async (
  page: Page,
  request: APIRequestContext,
  options: { readonly atelierId?: string; readonly displayName?: string } = {}
): Promise<string> => {
  const email = `e2e-${crypto.randomUUID()}@etabli.test`
  const password = 'un-mot-de-passe'

  const registered = await request.post(`${apiUrl}/auth/register`, {
    data: { email, password, displayName: options.displayName ?? 'Compte isolé' },
  })
  expect(registered.status()).toBe(201)

  if (options.atelierId !== undefined) {
    const { token } = (await registered.json()) as { readonly token: string }
    const joined = await request.post(`${apiUrl}/onboarding/complete`, {
      headers: { authorization: `Bearer ${token}` },
      data: { atelierId: options.atelierId, practice: ['bois'] },
    })
    expect(joined.status()).toBe(201)
  }

  await signIn(page, email, password)
  return email
}
