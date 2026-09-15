import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { freshMember, signIn } from '@/e2e/fixtures/auth.fixture'

const LA_FORGE = '0a7e1f00-0000-4000-8000-000000000001'

const themeOf = (page: Page) => page.locator('[data-theme]').first().getAttribute('data-theme')

const profileForm = (page: Page) => page.locator('form').filter({ has: page.getByLabel(/nom affiché/i) })

const preferencesForm = (page: Page) =>
  page.locator('form').filter({ has: page.getByRole('radio', { name: 'Système' }) })

const save = async (form: ReturnType<typeof profileForm>) => {
  await form.getByRole('button', { name: /enregistrer/i }).click()
  await expect(form.getByRole('status')).toBeVisible()
}

test('the settings page is private', async ({ page }) => {
  await page.goto('/parametres')
  await expect(page).toHaveURL(/\/connexion\?next=%2Fparametres$/)
})

test('a fresh account lands on the system theme and no preferred atelier', async ({ page, request }) => {
  await freshMember(page, request)

  await page.goto('/parametres')
  await expect(preferencesForm(page).getByRole('radio', { name: 'Système' })).toBeChecked()
  await expect(page.getByText(/rejoignez un atelier/i)).toBeVisible()
})

test('a chosen theme survives a reload and a sign-out', async ({ page, request }) => {
  const email = await freshMember(page, request)

  await page.goto('/parametres')
  const form = preferencesForm(page)
  await form.getByRole('radio', { name: 'Clair' }).check()
  await save(form)

  await expect(form.getByRole('status')).toHaveText(/préférences enregistrées/i)
  expect(await themeOf(page)).toBe('light')

  await page.reload()
  await expect(preferencesForm(page).getByRole('radio', { name: 'Clair' })).toBeChecked()
  expect(await themeOf(page)).toBe('light')

  await page.getByRole('button', { name: /se déconnecter/i }).click()
  await expect(page).toHaveURL(/\/connexion/)

  await signIn(page, email, 'un-mot-de-passe')
  await page.goto('/parametres')
  await expect(preferencesForm(page).getByRole('radio', { name: 'Clair' })).toBeChecked()
  expect(await themeOf(page)).toBe('light')
})

test('a renamed member is renamed in the header too, and the name survives a reload', async ({ page, request }) => {
  await freshMember(page, request, { displayName: 'Camille Roux' })
  await page.goto('/parametres')

  const form = profileForm(page)
  await form.getByLabel(/nom affiché/i).fill('Camille R.')
  await form.getByRole('checkbox', { name: 'Bois' }).check()
  await save(form)
  await expect(form.getByRole('status')).toHaveText(/profil enregistré/i)

  await expect(page.getByRole('banner').getByRole('link', { name: 'Camille R.' })).toBeVisible()

  await page.reload()
  await expect(profileForm(page).getByLabel(/nom affiché/i)).toHaveValue('Camille R.')
  await expect(profileForm(page).getByRole('checkbox', { name: 'Bois' })).toBeChecked()
})

test('the profile refuses a blank name and an empty practice, each with its own words', async ({ page, request }) => {
  await freshMember(page, request)
  await page.goto('/parametres')

  const form = profileForm(page)
  await form.getByRole('checkbox', { name: 'Bois' }).check()
  await form.getByLabel(/nom affiché/i).fill('   ')
  await form.getByRole('button', { name: /enregistrer/i }).click()
  await expect(form.getByRole('alert')).toHaveText(/nom affiché est obligatoire/i)

  await form.getByLabel(/nom affiché/i).fill('Camille R.')
  await form.getByRole('checkbox', { name: 'Bois' }).uncheck()
  await form.getByRole('button', { name: /enregistrer/i }).click()
  await expect(form.getByRole('alert')).toHaveText(/au moins une pratique/i)
})

test('a preferred atelier puts a shortcut in the header, and dropping it takes it away', async ({ page, request }) => {
  await freshMember(page, request, { atelierId: LA_FORGE })
  await page.goto('/parametres')

  const form = preferencesForm(page)
  await form.getByLabel(/atelier par défaut/i).selectOption({ index: 1 })
  await save(form)

  const shortcut = page.getByRole('banner').getByRole('link', { name: 'La Forge' })
  await expect(shortcut).toBeVisible()
  await expect(shortcut).toHaveAttribute('href', '/ateliers/la-forge-montreuil')

  await preferencesForm(page)
    .getByLabel(/atelier par défaut/i)
    .selectOption({ index: 0 })
  await save(preferencesForm(page))
  await expect(page.getByRole('banner').getByRole('link', { name: 'La Forge' })).toHaveCount(0)
})

test('an atelier the member never joined is not even offered', async ({ page, request }) => {
  await freshMember(page, request, { atelierId: LA_FORGE })
  await page.goto('/parametres')

  const select = preferencesForm(page).getByLabel(/atelier par défaut/i)
  await expect(select).toBeVisible()
  expect(await select.locator('option').allTextContents()).toEqual(['Aucun', 'La Forge'])
})
