import { expect, test } from '@playwright/test'

const newEmail = () => `e2e-${crypto.randomUUID()}@etabli.test`

test('creating an account lands on the onboarding', async ({ page }) => {
  await page.goto('/inscription')

  await page.getByLabel(/nom affiché/i).fill('Camille Roux')
  await page.getByLabel(/adresse e-mail/i).fill(newEmail())
  await page.getByLabel(/mot de passe/i).fill('un-mot-de-passe')
  await page.getByRole('button', { name: /créer mon compte/i }).click()

  await expect(page).toHaveURL(/\/bienvenue$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bienvenue')
})

test('refuses an address that already has an account', async ({ page }) => {
  const email = newEmail()

  await page.goto('/inscription')
  await page.getByLabel(/nom affiché/i).fill('Première inscription')
  await page.getByLabel(/adresse e-mail/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill('un-mot-de-passe')
  await page.getByRole('button', { name: /créer mon compte/i }).click()
  await expect(page).toHaveURL(/\/bienvenue$/)

  await page.goto('/inscription')
  await page.getByLabel(/nom affiché/i).fill('Seconde inscription')
  await page.getByLabel(/adresse e-mail/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill('un-mot-de-passe')
  await page.getByRole('button', { name: /créer mon compte/i }).click()

  await expect(page.getByRole('main').getByRole('alert')).toHaveText(/déjà un compte/i)
})
