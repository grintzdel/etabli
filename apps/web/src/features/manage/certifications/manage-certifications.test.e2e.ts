import { expect, test } from '@playwright/test'

const signIn = async (page: import('@playwright/test').Page, email: string) => {
  await page.goto('/connexion')
  await page.getByLabel(/adresse e-mail/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill('etabli-2026')
  await page.getByRole('button', { name: /se connecter/i }).click()
  await expect(page).toHaveURL(/\/(compte|bienvenue)$/)
}

const signOut = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: /se déconnecter/i }).click()
  await expect(page).toHaveURL(/\/connexion$/)
}

test('the review queue is private', async ({ page }) => {
  await page.goto('/manage/certifications')
  await expect(page).toHaveURL(/\/connexion\?next=%2Fmanage%2Fcertifications$/)
})

test('a plain member has no queue of its own', async ({ page }) => {
  await signIn(page, 'membre@etabli.test')
  await page.goto('/manage/certifications')

  await expect(page.getByText(/aucune demande/i)).toBeVisible()
})

test('a member asks, the fabmanager grants, and the member is habilité', async ({ page }) => {
  const machineName = `Habilitable ${crypto.randomUUID().slice(0, 8)}`

  await signIn(page, 'fabmanager.forge@etabli.test')
  await page.goto('/manage/machines')
  await page.getByLabel('Nom').fill(machineName)
  await page.getByRole('button', { name: /ajouter la machine/i }).click()
  await expect(page.getByRole('row').filter({ hasText: machineName })).toBeVisible()
  await signOut(page)

  await signIn(page, 'membre@etabli.test')
  await page.goto('/habilitations')
  const row = page.getByRole('row').filter({ hasText: machineName })
  await row.getByRole('button', { name: /^demander une habilitation/i }).click()
  await expect(page.getByRole('row').filter({ hasText: machineName }).getByText('En attente')).toBeVisible()
  await signOut(page)

  await signIn(page, 'fabmanager.forge@etabli.test')
  await page.goto('/manage/certifications')
  const queued = page.getByRole('row').filter({ hasText: machineName })
  await expect(queued.getByText('En attente')).toBeVisible()
  await queued.getByRole('button', { name: /^accorder/i }).click()
  await expect(page.getByRole('row').filter({ hasText: machineName }).getByText('Accordée')).toBeVisible()
  await signOut(page)

  await signIn(page, 'membre@etabli.test')
  await page.goto('/habilitations')
  await expect(page.getByRole('row').filter({ hasText: machineName }).getByText('Habilité')).toBeVisible()
})

test('a revoked habilitation can be asked for again', async ({ page }) => {
  const machineName = `Révocable ${crypto.randomUUID().slice(0, 8)}`

  await signIn(page, 'fabmanager.forge@etabli.test')
  await page.goto('/manage/machines')
  await page.getByLabel('Nom').fill(machineName)
  await page.getByRole('button', { name: /ajouter la machine/i }).click()
  await expect(page.getByRole('row').filter({ hasText: machineName })).toBeVisible()
  await signOut(page)

  await signIn(page, 'membre@etabli.test')
  await page.goto('/habilitations')
  await page
    .getByRole('row')
    .filter({ hasText: machineName })
    .getByRole('button', { name: /^demander une habilitation/i })
    .click()
  await expect(page.getByRole('row').filter({ hasText: machineName }).getByText('En attente')).toBeVisible()
  await signOut(page)

  await signIn(page, 'fabmanager.forge@etabli.test')
  await page.goto('/manage/certifications')
  await page
    .getByRole('row')
    .filter({ hasText: machineName })
    .getByRole('button', { name: /^révoquer/i })
    .click()
  await expect(page.getByRole('row').filter({ hasText: machineName }).getByText('Révoquée')).toBeVisible()
  await signOut(page)

  await signIn(page, 'membre@etabli.test')
  await page.goto('/habilitations')
  const row = page.getByRole('row').filter({ hasText: machineName })
  await expect(row.getByText('Refusée')).toBeVisible()
  await expect(row.getByRole('button', { name: /^demander une habilitation/i })).toBeVisible()
})
