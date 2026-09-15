import { expect, test } from '@playwright/test'

import { signIn, tokenOf } from '@/e2e/fixtures/auth.fixture'
import { bookAFreeSlot } from '@/e2e/fixtures/booking.fixture'

const dayOf = (iso: string): string =>
  new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date(iso))

test('the desk is private', async ({ page }) => {
  await page.goto('/manage/bookings')
  await expect(page).toHaveURL(/\/connexion\?next=%2Fmanage%2Fbookings$/)
})

test('a plain member runs no desk', async ({ page }) => {
  await signIn(page, 'membre@etabli.test')
  await page.goto('/manage/bookings')

  await expect(page.getByText(/aucune réservation ce jour-là/i)).toBeVisible()
})

test('the fabmanager finds the slot a member took, on its day and on no other', async ({ page, request }) => {
  const booking = await bookAFreeSlot(request, await tokenOf(request, 'membre@etabli.test'))

  await signIn(page, 'fabmanager.copeaux@etabli.test')
  await page.goto(`/manage/bookings?day=${dayOf(booking.startAt)}`)

  const row = page.locator(`tr[id="${booking.id}"]`)
  await expect(row).toBeVisible()
  await expect(row.getByText(booking.machineName)).toBeVisible()
  await expect(row.getByText('Camille Roux')).toBeVisible()
  await expect(row.getByText('Confirmée')).toBeVisible()
  await expect(row.getByRole('button', { name: /pointer/i })).toBeHidden()
  await expect(row.getByRole('button', { name: /marquer non honorée/i })).toBeHidden()

  await page.goto('/manage/bookings?day=2020-01-06')
  await expect(page.getByText(/aucune réservation ce jour-là/i)).toBeVisible()
})

test('the fabmanager of another atelier sees nothing of that slot', async ({ page, request }) => {
  const booking = await bookAFreeSlot(request, await tokenOf(request, 'membre@etabli.test'))

  await signIn(page, 'fabmanager.lyon@etabli.test')
  await page.goto(`/manage/bookings?day=${dayOf(booking.startAt)}`)

  await expect(page.locator(`tr[id="${booking.id}"]`)).toHaveCount(0)
})

test('the fabmanager calls off a slot a member took', async ({ page, request }) => {
  const booking = await bookAFreeSlot(request, await tokenOf(request, 'membre@etabli.test'))

  await signIn(page, 'fabmanager.copeaux@etabli.test')
  await page.goto(`/manage/bookings?day=${dayOf(booking.startAt)}`)

  const row = page.locator(`tr[id="${booking.id}"]`)
  await row.getByRole('button', { name: /^annuler$/i }).click()

  await expect(page.locator(`tr[id="${booking.id}"]`)).toContainText('Annulée')
  await expect(page.locator(`tr[id="${booking.id}"]`).getByRole('button', { name: /^annuler$/i })).toHaveCount(0)
})
