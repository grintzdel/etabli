import { expect, test } from '@playwright/test'

const signIn = async (page: import('@playwright/test').Page, email: string) => {
  await page.goto('/connexion')
  await page.getByLabel(/adresse e-mail/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill('etabli-2026')
  await page.getByRole('button', { name: /se connecter/i }).click()
  await expect(page).toHaveURL(/\/(compte|bienvenue)$/)
}

test('the admin page is private', async ({ page }) => {
  await page.goto('/admin/ateliers')
  await expect(page).toHaveURL(/\/connexion\?next=%2Fadmin%2Fateliers$/)
})

test('a plain member is turned away', async ({ page }) => {
  await signIn(page, 'membre@etabli.test')
  await page.goto('/admin/ateliers')

  await expect(page.getByRole('main').getByRole('alert')).toHaveText(/réservée à l’administration/i)
})

test('an admin opens an atelier, publishes it, and the public directory picks it up', async ({ page }) => {
  const slug = `e2e-${crypto.randomUUID().slice(0, 8)}`
  await signIn(page, 'admin@etabli.test')
  await page.goto('/admin/ateliers')

  await page.getByLabel('Nom').fill('Atelier E2E')
  await page.getByLabel(/identifiant d’url/i).fill(slug)
  await page.getByLabel('Ville').fill('Montreuil')
  await page.getByLabel('Latitude').fill('48.8638')
  await page.getByLabel('Longitude').fill('2.4485')
  await page.getByRole('button', { name: /créer le brouillon/i }).click()

  const row = page.getByRole('row').filter({ hasText: `/${slug}` })
  await expect(row.getByText('Brouillon')).toBeVisible()

  await page.goto('/ateliers')
  await expect(page.getByRole('link', { name: /Atelier E2E/ })).toHaveCount(0)

  await page.goto('/admin/ateliers')
  await page
    .getByRole('row')
    .filter({ hasText: `/${slug}` })
    .getByRole('button', { name: /publier/i })
    .click()
  await expect(
    page
      .getByRole('row')
      .filter({ hasText: `/${slug}` })
      .getByText('Publié')
  ).toBeVisible()

  await page.goto(`/ateliers/${slug}`)
  await expect(page.getByRole('heading', { name: 'Atelier E2E' })).toBeVisible()
})

test('refuses a slug that is not url-shaped', async ({ page }) => {
  await signIn(page, 'admin@etabli.test')
  await page.goto('/admin/ateliers')

  await page.getByLabel('Nom').fill('Atelier E2E')
  await page.getByLabel(/identifiant d’url/i).fill('Pas Un Slug')
  await page.getByLabel('Ville').fill('Montreuil')
  await page.getByLabel('Latitude').fill('48.8638')
  await page.getByLabel('Longitude').fill('2.4485')
  await page.getByRole('button', { name: /créer le brouillon/i }).click()

  await expect(page.getByRole('main').getByRole('alert')).toHaveText(/minuscules, des chiffres et des tirets/i)
})
