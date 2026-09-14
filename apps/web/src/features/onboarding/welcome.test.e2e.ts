import { expect, test } from '@playwright/test'

const register = async (page: import('@playwright/test').Page) => {
  await page.goto('/inscription')
  await page.getByLabel(/nom affiché/i).fill('Camille Roux')
  await page.getByLabel(/adresse e-mail/i).fill(`e2e-${crypto.randomUUID()}@etabli.test`)
  await page.getByLabel(/mot de passe/i).fill('un-mot-de-passe')
  await page.getByRole('button', { name: /créer mon compte/i }).click()
  await expect(page).toHaveURL(/\/bienvenue$/)
}

test('the onboarding is private', async ({ page }) => {
  await page.goto('/bienvenue')
  await expect(page).toHaveURL(/\/connexion\?next=%2Fbienvenue$/)
})

test('a fresh account joins an atelier and sees it on its account page', async ({ page }) => {
  await register(page)

  await page.getByRole('radio').first().check()
  await page.getByRole('checkbox', { name: 'Bois' }).check()
  await page.getByRole('button', { name: /rejoindre cet atelier/i }).click()

  await expect(page).toHaveURL(/\/compte$/)
  await expect(page.getByRole('list', { name: /mes ateliers/i }).getByRole('listitem')).toHaveCount(1)
  await expect(page.getByRole('definition').filter({ hasText: 'Bois' })).toHaveCount(1)
})

test('refuses to join without declaring a practice', async ({ page }) => {
  await register(page)

  await page.getByRole('radio').first().check()
  await page.getByRole('button', { name: /rejoindre cet atelier/i }).click()

  await expect(page.getByRole('main').getByRole('alert')).toHaveText(/au moins une pratique/i)
  await expect(page).toHaveURL(/\/bienvenue$/)
})

test('sends an already onboarded member straight to its account', async ({ page }) => {
  await register(page)
  await page.getByRole('radio').first().check()
  await page.getByRole('checkbox', { name: 'Métal' }).check()
  await page.getByRole('button', { name: /rejoindre cet atelier/i }).click()
  await expect(page).toHaveURL(/\/compte$/)

  await page.goto('/bienvenue')
  await expect(page).toHaveURL(/\/compte$/)
})
