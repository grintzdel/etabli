import type { APIRequestContext } from '@playwright/test'
import { expect } from '@playwright/test'

import { apiUrl } from './auth.fixture'

export const BOOKABLE_MACHINE_ID = '0a7e1f00-0000-4000-8000-000000000402'
export const CERTIFIED_MACHINE_ID = '0a7e1f00-0000-4000-8000-000000000101'
export const MAINTENANCE_MACHINE_ID = '0a7e1f00-0000-4000-8000-000000000102'
export const RETIRED_MACHINE_ID = '0a7e1f00-0000-4000-8000-000000000105'

type Slot = { readonly startAt: string; readonly available: boolean }
type Availability = { readonly slots: ReadonlyArray<Slot> }
type Booking = { readonly id: string; readonly machineName: string; readonly startAt: string }

export const bookAFreeSlot = async (
  request: APIRequestContext,
  token: string,
  machineId: string = BOOKABLE_MACHINE_ID
): Promise<Booking> => {
  const headers = { authorization: `Bearer ${token}` }

  const response = await request.get(`${apiUrl}/machines/${machineId}/availability`, { headers })
  expect(response.status()).toBe(200)

  const free = ((await response.json()) as Availability).slots.filter((slot) => slot.available).toReversed()
  expect(free.length).toBeGreaterThan(0)

  const take = async (index: number): Promise<Booking> => {
    const slot = free[index]
    if (slot === undefined) throw new Error(`Every free slot of ${machineId} was taken while booking one.`)

    const created = await request.post(`${apiUrl}/bookings`, { headers, data: { machineId, startAt: slot.startAt } })
    if (created.status() === 201) return (await created.json()) as Booking

    expect(created.status()).toBe(409)
    return take(index + 1)
  }

  return take(0)
}

export const releaseBooking = async (request: APIRequestContext, token: string, id: string): Promise<void> => {
  const response = await request.post(`${apiUrl}/bookings/${id}/cancel`, {
    headers: { authorization: `Bearer ${token}` },
  })
  expect(response.status()).toBe(200)
}
