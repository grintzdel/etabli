import { expect, test } from '@playwright/test'

import { signIn } from '@/e2e/fixtures/auth.fixture'

test('the board is private', async ({ page }) => {
  await page.goto('/admin/stats')
  await expect(page).toHaveURL(/\/connexion\?next=%2Fadmin%2Fstats$/)
})

test('a fabmanager is turned away from the network board', async ({ page }) => {
  await signIn(page, 'fabmanager.copeaux@etabli.test')
  await page.goto('/admin/stats')

  await expect(page.getByText(/réservée aux administrateurs/i)).toBeVisible()
})

test('the admin reads every atelier of the network, busiest first', async ({ page }) => {
  await signIn(page, 'admin@etabli.test')
  await page.goto('/admin/stats?period=7d')

  await expect(page.getByRole('row', { name: /copeaux & cie/i })).toBeVisible()
  await expect(page.getByRole('row', { name: /fabrique lyonnaise/i })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Période' })).toHaveValue('7d')
})

test('the span follows the period the admin picks', async ({ page }) => {
  await signIn(page, 'admin@etabli.test')

  await page.goto('/admin/stats?period=90d')
  await expect(page.getByRole('combobox', { name: 'Période' })).toHaveValue('90d')

  await page.goto('/admin/stats?period=1y')
  await expect(page.getByRole('combobox', { name: 'Période' })).toHaveValue('30d')
})
