import { expect, test } from '@playwright/test'

import { FRESH_PASSWORD, freshMember, SEED_PASSWORD, signIn, tokenOf } from '@/e2e/fixtures/auth.fixture'
import {
  BOOKABLE_MACHINE_ID,
  CERTIFIED_MACHINE_ID,
  MAINTENANCE_MACHINE_ID,
  OUTSIDE_MACHINE_ID,
  releaseBooking,
  RETIRED_MACHINE_ID,
  unfoldWeek,
} from '@/e2e/fixtures/booking.fixture'

test('a visitor picks a slot, signs in, and books it where they left it', async ({ page, request }) => {
  await page.goto(`/machines/${BOOKABLE_MACHINE_ID}`)

  await expect(page.getByRole('heading', { name: 'Bambu Lab P1S' })).toBeVisible()
  await unfoldWeek(page)
  const slot = page.getByRole('button', { name: /— Libre$/ }).first()
  const label = (await slot.getAttribute('aria-label')) ?? ''
  await slot.click()
  await expect(page.getByRole('button', { name: /réserver ce créneau/i })).toHaveCount(0)

  await page.getByRole('link', { name: /se connecter pour réserver/i }).click()
  await expect(page).toHaveURL(/\/connexion\?next=%2Fmachines%2F.+creneau/)
  await page.getByLabel(/adresse e-mail/i).fill('membre@etabli.test')
  await page.getByLabel(/mot de passe/i).fill(SEED_PASSWORD)
  await page.getByRole('button', { name: /se connecter/i }).click()

  await expect(page).toHaveURL(new RegExp(`/machines/${BOOKABLE_MACHINE_ID}\\?creneau=`))
  await unfoldWeek(page)
  await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: /réserver ce créneau/i }).click()

  await expect(page).toHaveURL(/\/reservations\/[0-9a-f-]{36}$/)
  const id = new URL(page.url()).pathname.split('/').at(-1) ?? ''
  await releaseBooking(request, await tokenOf(request, 'membre@etabli.test'), id)
})

test('a member of another atelier joins it from the slot and comes back to book it', async ({ page, request }) => {
  const email = await freshMember(page, request)
  await page.goto(`/machines/${OUTSIDE_MACHINE_ID}`)

  await expect(page.getByRole('heading', { name: 'Singer 4423 Heavy Duty' })).toBeVisible()
  await unfoldWeek(page)
  await page
    .getByRole('button', { name: /— Libre$/ })
    .first()
    .click()
  await page.getByRole('link', { name: /rejoindre atelier des canuts/i }).click()

  await expect(page).toHaveURL(/\/bienvenue\?atelier=atelier-des-canuts&next=/)
  await expect(page.getByRole('radio')).toHaveCount(1)
  await page.getByRole('radio').check()
  await page.getByRole('checkbox', { name: 'Textile' }).check()
  await page.getByRole('button', { name: /rejoindre cet atelier/i }).click()

  await expect(page).toHaveURL(new RegExp(`/machines/${OUTSIDE_MACHINE_ID}\\?creneau=`))
  await page.getByRole('button', { name: /réserver ce créneau/i }).click()

  await expect(page).toHaveURL(/\/reservations\/[0-9a-f-]{36}$/)
  const id = new URL(page.url()).pathname.split('/').at(-1) ?? ''
  await releaseBooking(request, await tokenOf(request, email, FRESH_PASSWORD), id)
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
  await unfoldWeek(page)
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

test('a machine that demands an habilitation offers the request, not a booking bound to fail', async ({ page }) => {
  // Théo is a member of the atelier and holds no certification on this machine; the demo member does.
  await signIn(page, 'theo@etabli.test')
  await page.goto(`/machines/${CERTIFIED_MACHINE_ID}`)

  await expect(page.getByText(/cette machine exige une habilitation/i)).toBeVisible()
  await unfoldWeek(page)
  await page
    .getByRole('button', { name: /— Libre$/ })
    .first()
    .click()

  await expect(page.getByRole('button', { name: /demander l’habilitation/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /réserver ce créneau/i })).toHaveCount(0)
})

test('a machine under maintenance offers not a single slot', async ({ page }) => {
  await signIn(page, 'membre@etabli.test')
  await page.goto(`/machines/${MAINTENANCE_MACHINE_ID}`)

  await expect(page.getByText('En maintenance')).toBeVisible()
  await unfoldWeek(page)
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
