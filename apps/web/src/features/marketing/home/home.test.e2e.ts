import { expect, test } from '@playwright/test'

test('states the promise in a single heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/droit de s'en servir/i)
})

test('explains the product in three steps', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('listitem').filter({ hasText: /habilit/i })).toHaveCount(1)
  await expect(page.getByRole('list', { name: /fonctionnement/i }).getByRole('listitem')).toHaveCount(3)
})

test('offers a way into the atelier directory', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: /découvrir les ateliers/i })).toHaveAttribute('href', '/ateliers')
})

test('carries a title and a description for search engines', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Établi/)
  const description = await page.locator('meta[name="description"]').getAttribute('content')
  expect(description).toMatch(/habilitation/i)
})

test('serves robots.txt pointing at the sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt')
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain('Sitemap:')
})

test('serves a sitemap containing the home page', async ({ request }) => {
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain('<loc>')
})
