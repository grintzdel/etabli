import { expect, test } from '@playwright/test'

test('the application boots on the marketing home', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
})

test('the page is served in French', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
})

test('the page paints the graphite background', async ({ page }) => {
  await page.goto('/')
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(background).toBe('rgb(11, 12, 14)')
})
