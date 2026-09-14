import { expect, test } from '@playwright/test'

const PASSWORD = 'un-mot-de-passe'

const register = async (page: import('@playwright/test').Page, email: string) => {
  await page.goto('/inscription')
  await page.getByLabel(/nom affiché/i).fill('Camille Roux')
  await page.getByLabel(/adresse e-mail/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill(PASSWORD)
  await page.getByRole('button', { name: /créer mon compte/i }).click()
  await expect(page).toHaveURL(/\/bienvenue$/)
}

test('signing out returns to the sign-in page and closes the private area', async ({ page }) => {
  await register(page, `e2e-${crypto.randomUUID()}@etabli.test`)

  await page.getByRole('button', { name: /se déconnecter/i }).click()
  await expect(page).toHaveURL(/\/connexion$/)

  await page.goto('/compte')
  await expect(page).toHaveURL(/\/connexion\?next=%2Fcompte$/)
})

test('the private area redirects to sign-in when no session is present', async ({ page }) => {
  await page.goto('/compte')
  await expect(page).toHaveURL(/\/connexion\?next=%2Fcompte$/)
})

test('signing back in reopens the account', async ({ page }) => {
  const email = `e2e-${crypto.randomUUID()}@etabli.test`
  await register(page, email)
  await page.getByRole('button', { name: /se déconnecter/i }).click()
  await expect(page).toHaveURL(/\/connexion$/)

  await page.getByLabel(/adresse e-mail/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill(PASSWORD)
  await page.getByRole('button', { name: /se connecter/i }).click()

  await expect(page).toHaveURL(/\/compte$/)
  await expect(page.getByText(email)).toBeVisible()
})

test('a wrong password and an unknown address give the same message', async ({ page }) => {
  const email = `e2e-${crypto.randomUUID()}@etabli.test`
  await register(page, email)
  await page.getByRole('button', { name: /se déconnecter/i }).click()
  await expect(page).toHaveURL(/\/connexion$/)

  await page.getByLabel(/adresse e-mail/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill('pas-le-bon-mot-de-passe')
  await page.getByRole('button', { name: /se connecter/i }).click()
  const wrongPassword = await page.getByRole('main').getByRole('alert').textContent()

  await page.goto('/connexion')
  await page.getByLabel(/adresse e-mail/i).fill(`absent-${crypto.randomUUID()}@etabli.test`)
  await page.getByLabel(/mot de passe/i).fill(PASSWORD)
  await page.getByRole('button', { name: /se connecter/i }).click()
  const unknownAddress = await page.getByRole('main').getByRole('alert').textContent()

  expect(wrongPassword).toMatch(/incorrect/i)
  expect(unknownAddress).toBe(wrongPassword)
})
