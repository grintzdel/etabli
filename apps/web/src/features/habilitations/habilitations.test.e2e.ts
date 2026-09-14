import { expect, test } from '@playwright/test'

const signIn = async (page: import('@playwright/test').Page, email: string) => {
  await page.goto('/connexion')
  await page.getByLabel(/adresse e-mail/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill('etabli-2026')
  await page.getByRole('button', { name: /se connecter/i }).click()
  await expect(page).toHaveURL(/\/(compte|bienvenue)$/)
}

test('the habilitations page is private', async ({ page }) => {
  await page.goto('/habilitations')
  await expect(page).toHaveURL(/\/connexion\?next=%2Fhabilitations$/)
})

test('a member sees the machines of its atelier and can ask for one', async ({ page }) => {
  await signIn(page, 'membre@etabli.test')
  await page.goto('/habilitations')

  const first = page
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: /^demander une habilitation/i }) })
    .first()
  await expect(first).toBeVisible()
  const machine = await first.getByRole('rowheader').textContent()

  await first.getByRole('button', { name: /^demander une habilitation/i }).click()

  await expect(
    page
      .getByRole('row')
      .filter({ hasText: machine ?? '' })
      .getByText('En attente')
  ).toBeVisible()
})

test('an account that joined no atelier is told so', async ({ page }) => {
  await page.goto('/inscription')
  await page.getByLabel(/nom affiché/i).fill('Sans atelier')
  await page.getByLabel(/adresse e-mail/i).fill(`e2e-${crypto.randomUUID()}@etabli.test`)
  await page.getByLabel(/mot de passe/i).fill('un-mot-de-passe')
  await page.getByRole('button', { name: /créer mon compte/i }).click()
  await expect(page).toHaveURL(/\/bienvenue$/)

  await page.goto('/habilitations')
  await expect(page.getByText(/aucune machine de vos ateliers/i)).toBeVisible()
})
