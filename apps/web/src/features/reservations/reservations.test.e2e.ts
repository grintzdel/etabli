import { expect, test } from '@playwright/test'

import { signIn, tokenOf } from '@/e2e/fixtures/auth.fixture'
import { bookAFreeSlot } from '@/e2e/fixtures/booking.fixture'

test('the bookings page is private', async ({ page }) => {
  await page.goto('/reservations')
  await expect(page).toHaveURL(/\/connexion\?next=%2Freservations$/)
})

test('an account that booked nothing is pointed at the ateliers', async ({ page }) => {
  await page.goto('/inscription')
  await page.getByLabel(/nom affiché/i).fill('Sans réservation')
  await page.getByLabel(/adresse e-mail/i).fill(`e2e-${crypto.randomUUID()}@etabli.test`)
  await page.getByLabel(/mot de passe/i).fill('un-mot-de-passe')
  await page.getByRole('button', { name: /créer mon compte/i }).click()
  await expect(page).toHaveURL(/\/bienvenue$/)

  await page.goto('/reservations')
  await expect(page.getByText(/vous n’avez encore rien réservé/i)).toBeVisible()
  await expect(page.getByRole('link', { name: /voir les ateliers/i })).toBeVisible()
})

test('a member finds its slot among the ones ahead', async ({ page, request }) => {
  const booking = await bookAFreeSlot(request, await tokenOf(request, 'membre@etabli.test'))

  await signIn(page, 'membre@etabli.test')
  await page.goto('/reservations')

  const row = page.getByRole('row').filter({ has: page.locator(`a[href="/reservations/${booking.id}"]`) })
  await expect(row).toBeVisible()
  await expect(row.getByRole('link', { name: booking.machineName })).toBeVisible()
  await expect(row.getByText('Confirmée')).toBeVisible()
})
