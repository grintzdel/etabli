import { expect, test } from '@playwright/test'

test('answers the directory with a heading and a filter form', async ({ page }) => {
  await page.goto('/ateliers')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/les ateliers/i)
  await expect(page.getByRole('form', { name: /filtrer/i })).toBeVisible()
})

test('carries a title, a description and a canonical for search engines', async ({ page }) => {
  await page.goto('/ateliers')
  await expect(page).toHaveTitle(/annuaire des ateliers/i)

  const description = await page.locator('meta[name="description"]').getAttribute('content')
  expect(description).toMatch(/atelier partagé/i)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/ateliers$/)
})

test('filters through the URL so a search stays shareable', async ({ page }) => {
  await page.goto('/ateliers')
  await page.getByLabel(/ville/i).fill('Montreuil')
  await page.getByRole('button', { name: /filtrer/i }).click()

  await expect(page).toHaveURL(/\?.*city=Montreuil/)
  await expect(page.getByLabel(/ville/i)).toHaveValue('Montreuil')
})

test('keeps the machine kind selected after the round trip', async ({ page }) => {
  await page.goto('/ateliers?machineKind=SEWING')
  await expect(page.getByLabel(/type de machine/i)).toHaveValue('SEWING')
})

test('ignores a machine kind it does not publish', async ({ page }) => {
  await page.goto('/ateliers?machineKind=TELEPORTEUR')
  await expect(page.getByLabel(/type de machine/i)).toHaveValue('')
})

test('lists the published ateliers and hides the drafts', async ({ page }) => {
  await page.goto('/ateliers')
  const ateliers = page.getByRole('list', { name: 'Ateliers' })

  await expect(ateliers.getByRole('link', { name: 'La Forge' })).toBeVisible()
  await expect(ateliers.getByRole('link', { name: 'Fabrique Lyonnaise' })).toBeVisible()
  await expect(ateliers.getByRole('link', { name: /en préparation/i })).toHaveCount(0)
})

test('narrows the directory down to one city', async ({ page }) => {
  await page.goto('/ateliers?city=Lyon')
  const ateliers = page.getByRole('list', { name: 'Ateliers' })

  await expect(ateliers.getByRole('link', { name: 'Fabrique Lyonnaise' })).toBeVisible()
  await expect(ateliers.getByRole('link', { name: 'La Forge' })).toHaveCount(0)
})

test('narrows the directory down to one machine kind', async ({ page }) => {
  await page.goto('/ateliers?machineKind=WOOD_LATHE')
  const ateliers = page.getByRole('list', { name: 'Ateliers' })

  await expect(ateliers.getByRole('link', { name: 'La Forge' })).toBeVisible()
  await expect(ateliers.getByRole('link', { name: 'Fabrique Lyonnaise' })).toHaveCount(0)
})
