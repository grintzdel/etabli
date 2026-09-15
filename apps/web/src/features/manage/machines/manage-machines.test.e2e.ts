import { expect, test } from '@playwright/test'

import { signIn } from '@/e2e/fixtures/auth.fixture'

test('the parc page is private', async ({ page }) => {
  await page.goto('/manage/machines')
  await expect(page).toHaveURL(/\/connexion\?next=%2Fmanage%2Fmachines$/)
})

test('a plain member manages no parc', async ({ page }) => {
  await signIn(page, 'membre@etabli.test')
  await page.goto('/manage/machines')

  await expect(page.getByText(/ne gérez le parc d’aucun atelier/i)).toBeVisible()
})

const SHEET = '/ateliers/la-forge-montreuil'

const addMachine = async (page: import('@playwright/test').Page, name: string, slot = '60') => {
  await page.getByLabel('Nom').fill(name)
  await page.getByLabel(/créneau/i).fill(slot)
  await page.getByRole('button', { name: /ajouter la machine/i }).click()
  await expect(page.getByRole('row').filter({ hasText: name })).toBeVisible()
}

test('a fabmanager adds a machine and the public sheet picks it up', async ({ page }) => {
  const name = `Machine E2E ${crypto.randomUUID().slice(0, 8)}`
  await signIn(page, 'fabmanager.forge@etabli.test')
  await page.goto('/manage/machines')

  await addMachine(page, name, '90')

  const row = page.getByRole('row').filter({ hasText: name })
  await expect(row.getByText('Disponible')).toBeVisible()
  await expect(row.getByText('90 min')).toBeVisible()

  await page.goto(SHEET)
  await expect(page.getByRole('rowheader', { name: new RegExp(name) })).toBeVisible()
})

test('retiring a machine takes it off the public sheet', async ({ page }) => {
  const name = `À retirer ${crypto.randomUUID().slice(0, 8)}`
  await signIn(page, 'fabmanager.forge@etabli.test')
  await page.goto('/manage/machines')

  await addMachine(page, name)
  await page.goto(SHEET)
  await expect(page.getByRole('rowheader', { name: new RegExp(name) })).toBeVisible()

  await page.goto('/manage/machines')
  await page.getByRole('button', { name: new RegExp(`Retirer — ${name}`) }).click()
  await expect(page.getByRole('row').filter({ hasText: name }).getByText('Retirée')).toBeVisible()

  await page.goto(SHEET)
  await expect(page.getByRole('rowheader', { name: new RegExp(name) })).toHaveCount(0)
})

test('the browser refuses a slot outside the allowed range before it reaches the server', async ({ page }) => {
  await signIn(page, 'fabmanager.forge@etabli.test')
  await page.goto('/manage/machines')

  await page.getByLabel('Nom').fill('Machine refusée')
  await page.getByLabel(/créneau/i).fill('5')
  await page.getByRole('button', { name: /ajouter la machine/i }).click()

  await expect(page.getByLabel(/créneau/i)).toHaveJSProperty('validity.valid', false)
  await expect(page.getByRole('row').filter({ hasText: 'Machine refusée' })).toHaveCount(0)
})

const nfcRow = (page: import('@playwright/test').Page, name: string) => page.getByRole('row').filter({ hasText: name })

test('the fabmanager sticks a tag on a machine, then peels it off', async ({ page }) => {
  const name = `Machine NFC ${crypto.randomUUID().slice(0, 8)}`
  const tag = `nfc-e2e-${crypto.randomUUID().slice(0, 8)}`

  await signIn(page, 'fabmanager.forge@etabli.test')
  await page.goto('/manage/machines')
  await addMachine(page, name)

  await nfcRow(page, name)
    .getByLabel(/tag nfc/i)
    .fill(tag)
  await nfcRow(page, name)
    .getByRole('button', { name: /enregistrer/i })
    .click()
  await expect(nfcRow(page, name).getByText(/tag posé/i)).toBeVisible()

  await page.reload()
  await expect(nfcRow(page, name).getByLabel(/tag nfc/i)).toHaveValue(tag)

  await nfcRow(page, name)
    .getByLabel(/tag nfc/i)
    .fill('')
  await nfcRow(page, name)
    .getByRole('button', { name: /enregistrer/i })
    .click()
  await expect(nfcRow(page, name).getByText(/tag décollé/i)).toBeVisible()

  await page.reload()
  await expect(nfcRow(page, name).getByLabel(/tag nfc/i)).toHaveValue('')
})

test('a tag already worn by another machine of the network is refused', async ({ page }) => {
  const name = `Machine NFC prise ${crypto.randomUUID().slice(0, 8)}`

  await signIn(page, 'fabmanager.forge@etabli.test')
  await page.goto('/manage/machines')
  await addMachine(page, name)

  await nfcRow(page, name)
    .getByLabel(/tag nfc/i)
    .fill('nfc-forge-cnc-01')
  await nfcRow(page, name)
    .getByRole('button', { name: /enregistrer/i })
    .click()

  await expect(nfcRow(page, name).getByText(/déjà posé sur une autre machine/i)).toBeVisible()
})
