import { expect, test } from '@playwright/test'

const apiUrl = process.env.API_URL ?? 'http://localhost:3001'

test('GET /auth/me answers 401 without an Authorization header', async ({ request }) => {
  const response = await request.get(`${apiUrl}/auth/me`)
  expect(response.status()).toBe(401)
})
