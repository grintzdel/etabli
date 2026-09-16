import { expect, test } from '@playwright/test'

import { signIn, tokenOf } from '@/e2e/fixtures/auth.fixture'
import {
  BOOKABLE_MACHINE_ID,
  CERTIFIED_MACHINE_ID,
  MAINTENANCE_MACHINE_ID,
  releaseBooking,
  RETIRED_MACHINE_ID,
} from '@/e2e/fixtures/booking.fixture'

test('the week of a machine is private', async ({ page }) => {
  await page.goto(`/machines/${BOOKABLE_MACHINE_ID}`)
  await expect(page).toHaveURL(new RegExp(`/connexion\\?next=%2Fmachines%2F${BOOKABLE_MACHINE_ID}$`))
})

test('a machine out of the parc is indistinguishable from one that never existed', async ({ page }) => {
  await signIn(page, 'membre@etabli.test')
  await page.goto(`/machines/${RETIRED_MACHINE_ID}`)

  await expect(page.getByRole('heading', { name: /cette page n’existe pas/i })).toBeVisible()
})

test('a member takes a free slot and lands on its booking', async ({ page, request }) => {
  await signIn(page, 'membre@etabli.test')
  await page.goto(`/machines/${BOOKABLE_MACHINE_ID}`)

  await expect(page.getByRole('heading', { name: 'Bambu Lab P1S' })).toBeVisible()
  await page
    .getByRole('button', { name: /— Libre$/ })
    .first()
    .click()
  await page.getByRole('button', { name: /réserver ce créneau/i }).click()

  await expect(page).toHaveURL(/\/reservations\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('heading', { name: 'Bambu Lab P1S' })).toBeVisible()
  await expect(page.getByText('Confirmée')).toBeVisible()

  const id = new URL(page.url()).pathname.split('/').at(-1) ?? ''
  await releaseBooking(request, await tokenOf(request, 'membre@etabli.test'), id)
})

test('a machine that demands an habilitation refuses the member who has none', async ({ page }) => {
  // Théo is a member of the atelier and holds no certification on this machine; the demo member does.
  await signIn(page, 'theo@etabli.test')
  await page.goto(`/machines/${CERTIFIED_MACHINE_ID}`)

  await expect(page.getByText(/cette machine exige une habilitation/i)).toBeVisible()
  await page
    .getByRole('button', { name: /— Libre$/ })
    .first()
    .click()
  await page.getByRole('button', { name: /réserver ce créneau/i }).click()

  await expect(page.getByText(/vous n’êtes pas habilité sur cette machine/i)).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`/machines/${CERTIFIED_MACHINE_ID}$`))
})

test('a machine under maintenance offers not a single slot', async ({ page }) => {
  await signIn(page, 'membre@etabli.test')
  await page.goto(`/machines/${MAINTENANCE_MACHINE_ID}`)

  await expect(page.getByText('En maintenance')).toBeVisible()
  await expect(page.getByRole('button', { name: /— Libre$/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /— Machine indisponible$/ }).first()).toBeDisabled()
})

test('the member walks to the week after and back', async ({ page }) => {
  await signIn(page, 'membre@etabli.test')
  await page.goto(`/machines/${BOOKABLE_MACHINE_ID}`)

  const label = page.getByText(/^Du /)
  const thisWeek = await label.textContent()

  await expect(page.getByRole('button', { name: /semaine précédente/i })).toBeDisabled()
  await page.getByRole('button', { name: /semaine suivante/i }).click()
  await expect(label).not.toHaveText(thisWeek ?? '')

  await page.getByRole('button', { name: /semaine précédente/i }).click()
  await expect(label).toHaveText(thisWeek ?? '')
})
