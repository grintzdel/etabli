import { expect, test } from '@playwright/test'

import { signIn, tokenOf } from '@/e2e/fixtures/auth.fixture'
import { bookAFreeSlot } from '@/e2e/fixtures/booking.fixture'

test('a booking that belongs to nobody known answers not found', async ({ page }) => {
  await signIn(page, 'membre@etabli.test')
  await page.goto(`/reservations/${crypto.randomUUID()}`)

  await expect(page.getByRole('heading', { name: /cette page n’existe pas/i })).toBeVisible()
})

test('a member cancels a slot ahead and sees it closed', async ({ page, request }) => {
  const booking = await bookAFreeSlot(request, await tokenOf(request, 'membre@etabli.test'))

  await signIn(page, 'membre@etabli.test')
  await page.goto(`/reservations/${booking.id}`)

  await expect(page.getByRole('heading', { name: booking.machineName })).toBeVisible()
  await page.getByRole('button', { name: /annuler la réservation/i }).click()

  await expect(page.getByText('Annulée', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /annuler la réservation/i })).toBeHidden()
  await expect(page.getByText(/cette réservation est close/i)).toBeVisible()
})
