import type { APIRequestContext } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { apiUrl, signIn } from '@/e2e/fixtures/auth.fixture'

const PASSWORD = 'un-mot-de-passe'

const registerAccount = async (
  request: APIRequestContext,
  displayName: string
): Promise<{ readonly email: string }> => {
  const email = `e2e-users-${crypto.randomUUID()}@etabli.test`
  const response = await request.post(`${apiUrl}/auth/register`, { data: { email, password: PASSWORD, displayName } })
  expect(response.status()).toBe(201)
  return { email }
}

test('the page is private', async ({ page }) => {
  await page.goto('/admin/utilisateurs')
  await expect(page).toHaveURL(/\/connexion\?next=%2Fadmin%2Futilisateurs$/)
})

test('a plain member is turned away', async ({ page }) => {
  await signIn(page, 'membre@etabli.test')
  await page.goto('/admin/utilisateurs')

  await expect(page.getByText(/réservée aux administrateurs/i)).toBeVisible()
})

test('the admin finds an account by its address and names it administrator', async ({ page, request }) => {
  const { email } = await registerAccount(request, 'Compte à nommer')

  await signIn(page, 'admin@etabli.test')
  await page.goto(`/admin/utilisateurs?search=${encodeURIComponent(email)}`)

  const row = page.getByRole('row', { name: /compte à nommer/i })
  await expect(row).toContainText('Membre')

  await row.getByRole('button', { name: /nommer administrateur/i }).click()

  await expect(page.getByRole('row', { name: /compte à nommer/i })).toContainText('Administrateur')
})

test('a suspended account can no longer sign in', async ({ page, request }) => {
  const { email } = await registerAccount(request, 'Compte à suspendre')

  await signIn(page, 'admin@etabli.test')
  await page.goto(`/admin/utilisateurs?search=${encodeURIComponent(email)}`)
  await page
    .getByRole('row', { name: /compte à suspendre/i })
    .getByRole('button', { name: /^suspendre$/i })
    .click()
  await expect(page.getByRole('row', { name: /compte à suspendre/i })).toContainText('Suspendu')

  await page.goto('/connexion')
  await page.getByLabel(/adresse e-mail/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill(PASSWORD)
  await page.getByRole('button', { name: /se connecter/i }).click()

  await expect(page.getByText(/compte est suspendu/i)).toBeVisible()
})

test('the admin cannot lock itself out', async ({ page }) => {
  await signIn(page, 'admin@etabli.test')
  await page.goto('/admin/utilisateurs?search=admin%40etabli.test')

  const row = page.getByRole('row', { name: /admin@etabli\.test/i })
  await row.getByRole('button', { name: /retirer l’administration/i }).click()

  await expect(row.getByRole('alert')).toContainText(/ni retirer votre propre rôle/i)
  await expect(row).toContainText('Administrateur')
})
