import { expect, test } from '@playwright/test'

import { signIn, tokenOf } from '@/e2e/fixtures/auth.fixture'
import { bookAFreeSlot } from '@/e2e/fixtures/booking.fixture'

test('the board is private', async ({ page }) => {
  await page.goto('/manage/stats')
  await expect(page).toHaveURL(/\/connexion\?next=%2Fmanage%2Fstats$/)
})

test('a plain member measures no atelier', async ({ page }) => {
  await signIn(page, 'membre@etabli.test')
  await page.goto('/manage/stats')

  await expect(page.getByText(/vous ne pilotez aucun atelier/i)).toBeVisible()
})

test('the fabmanager reads the slot a member just took among its machines', async ({ page, request }) => {
  const booking = await bookAFreeSlot(request, await tokenOf(request, 'membre@etabli.test'))

  await signIn(page, 'fabmanager.copeaux@etabli.test')
  await page.goto('/manage/stats?period=7d')

  await expect(page.getByRole('heading', { name: /copeaux & cie/i })).toBeVisible()
  await expect(page.getByRole('row', { name: new RegExp(booking.machineName, 'i') })).toBeVisible()
})

test('the span follows the period the fabmanager picks', async ({ page }) => {
  await signIn(page, 'fabmanager.copeaux@etabli.test')

  await page.goto('/manage/stats?period=7d')
  await expect(page.getByRole('combobox', { name: 'Période' })).toHaveValue('7d')
  await expect(page.getByText('98 h')).toBeVisible()

  await page.goto('/manage/stats?period=90d')
  await expect(page.getByRole('combobox', { name: 'Période' })).toHaveValue('90d')
  await expect(page.getByText('1260 h')).toBeVisible()
})

test('a span nobody offers falls back to the month', async ({ page }) => {
  await signIn(page, 'fabmanager.copeaux@etabli.test')
  await page.goto('/manage/stats?period=1y')

  await expect(page.getByRole('combobox', { name: 'Période' })).toHaveValue('30d')
  await expect(page.getByText('420 h')).toBeVisible()
})

test('the fabmanager of another atelier measures only its own', async ({ page }) => {
  await signIn(page, 'fabmanager.lyon@etabli.test')
  await page.goto('/manage/stats')

  await expect(page.getByRole('heading', { name: /fabrique lyonnaise/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /copeaux & cie/i })).toHaveCount(0)
})
