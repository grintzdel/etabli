import { expect, test } from '@playwright/test'

test('answers 404 on an atelier that does not exist', async ({ request }) => {
  const response = await request.get('/ateliers/cet-atelier-nexiste-pas')
  expect(response.status()).toBe(404)
})

test('shows a French not-found page rather than an empty sheet', async ({ page }) => {
  await page.goto('/ateliers/cet-atelier-nexiste-pas')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/cette page n.existe pas/i)
  await expect(page.getByRole('link', { name: /voir les ateliers/i })).toHaveAttribute('href', '/ateliers')
})

test('keeps an unknown atelier out of the index', async ({ page }) => {
  await page.goto('/ateliers/cet-atelier-nexiste-pas')
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/)
})

test('shows the sheet, its address and its parc', async ({ page }) => {
  await page.goto('/ateliers/la-forge-montreuil')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('La Forge')
  await expect(page.getByText('12 rue des Forges')).toBeVisible()
  await expect(page.getByRole('rowheader', { name: /Trotec Speedy 400/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /Prusa MK4/ })).toContainText('En maintenance')
})

test('carries a title, a description and a canonical for search engines', async ({ page }) => {
  await page.goto('/ateliers/la-forge-montreuil')

  await expect(page).toHaveTitle(/La Forge/)
  const description = await page.locator('meta[name="description"]').getAttribute('content')
  expect(description).toMatch(/Montreuil/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/ateliers\/la-forge-montreuil$/)
})

test('answers 404 on an atelier that is still a draft', async ({ request }) => {
  const response = await request.get('/ateliers/atelier-en-preparation')
  expect(response.status()).toBe(404)
})

test('leads back to the directory', async ({ page }) => {
  await page.goto('/ateliers/la-forge-montreuil')
  await page.getByRole('link', { name: /tous les ateliers/i }).click()
  await expect(page).toHaveURL(/\/ateliers$/)
})
