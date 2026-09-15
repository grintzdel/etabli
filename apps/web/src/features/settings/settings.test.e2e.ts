import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { freshMember, signIn } from '@/e2e/fixtures/auth.fixture'

const LA_FORGE = '0a7e1f00-0000-4000-8000-000000000001'

const themeOf = (page: Page) => page.locator('[data-theme]').first().getAttribute('data-theme')

const save = async (page: Page) => {
  await page.getByRole('button', { name: /enregistrer/i }).click()
  await expect(page.getByRole('status')).toBeVisible()
}

test('the settings page is private', async ({ page }) => {
  await page.goto('/parametres')
  await expect(page).toHaveURL(/\/connexion\?next=%2Fparametres$/)
})

test('a fresh account lands on the system theme and no preferred atelier', async ({ page, request }) => {
  await freshMember(page, request)

  await page.goto('/parametres')
  await expect(page.getByRole('radio', { name: 'Système' })).toBeChecked()
  await expect(page.getByText(/rejoignez un atelier/i)).toBeVisible()
})

test('a chosen theme survives a reload and a sign-out', async ({ page, request }) => {
  const email = await freshMember(page, request)

  await page.goto('/parametres')
  await page.getByRole('radio', { name: 'Clair' }).check()
  await save(page)

  await expect(page.getByRole('status')).toHaveText(/préférences enregistrées/i)
  expect(await themeOf(page)).toBe('light')

  await page.reload()
  await expect(page.getByRole('radio', { name: 'Clair' })).toBeChecked()
  expect(await themeOf(page)).toBe('light')

  await page.getByRole('button', { name: /se déconnecter/i }).click()
  await expect(page).toHaveURL(/\/connexion/)

  await signIn(page, email, 'un-mot-de-passe')
  await page.goto('/parametres')
  await expect(page.getByRole('radio', { name: 'Clair' })).toBeChecked()
  expect(await themeOf(page)).toBe('light')
})

test('a preferred atelier puts a shortcut in the header, and dropping it takes it away', async ({ page, request }) => {
  await freshMember(page, request, { atelierId: LA_FORGE })
  await page.goto('/parametres')

  const select = page.getByLabel(/atelier par défaut/i)
  await select.selectOption({ index: 1 })
  await save(page)

  const shortcut = page.getByRole('banner').getByRole('link', { name: 'La Forge' })
  await expect(shortcut).toBeVisible()
  await expect(shortcut).toHaveAttribute('href', '/ateliers/la-forge-montreuil')

  await select.selectOption({ index: 0 })
  await save(page)
  await expect(page.getByRole('banner').getByRole('link', { name: 'La Forge' })).toHaveCount(0)
})

test('an atelier the member never joined is not even offered', async ({ page, request }) => {
  await freshMember(page, request, { atelierId: LA_FORGE })
  await page.goto('/parametres')

  const options = await page
    .getByLabel(/atelier par défaut/i)
    .locator('option')
    .allTextContents()
  expect(options).toEqual(['Aucun', 'La Forge'])
})
