import { expect, test } from '@playwright/test'

import { freshMember, signIn } from '@/e2e/fixtures/auth.fixture'

test('the dashboard is private', async ({ page }) => {
  await page.goto('/tableau-de-bord')
  await expect(page).toHaveURL(/\/connexion\?next=%2Ftableau-de-bord$/)
})

test('signing in lands on the dashboard, greeted by name', async ({ page }) => {
  await signIn(page, 'membre@etabli.test')

  await expect(page).toHaveURL(/\/tableau-de-bord$/)
  await expect(page.getByRole('heading', { level: 1, name: /camille roux/i })).toBeVisible()
})

test('a member who joined no atelier is sent to onboarding', async ({ page, request }) => {
  await freshMember(page, request)
  await page.goto('/tableau-de-bord')

  await expect(page.getByRole('link', { name: /rejoindre un atelier/i })).toHaveAttribute('href', '/bienvenue')
})

test('a member of an atelier with nothing booked is sent to the directory', async ({ page, request }) => {
  await freshMember(page, request, { atelierId: '0a7e1f00-0000-4000-8000-000000000001' })
  await page.goto('/tableau-de-bord')

  await expect(page.getByText(/rien de prévu/i)).toBeVisible()
  await expect(page.getByRole('link', { name: /réserver une machine/i })).toHaveAttribute('href', '/ateliers')
})

test('the counters link to the pages they summarise', async ({ page }) => {
  await signIn(page, 'membre@etabli.test')

  await page.getByRole('link', { name: /créneaux à venir/i }).click()
  await expect(page).toHaveURL(/\/reservations$/)
})
