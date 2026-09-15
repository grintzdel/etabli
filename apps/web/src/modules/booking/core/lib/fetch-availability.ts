import type { MachineAvailability } from '../model/booking'
import { FAILURE_MESSAGES } from '../model/booking'

const messageOf = (body: unknown): string => {
  if (typeof body !== 'object' || body === null) return FAILURE_MESSAGES.UNREACHABLE
  const message = (body as { readonly message?: unknown }).message
  return typeof message === 'string' ? message : FAILURE_MESSAGES.UNREACHABLE
}

export const fetchAvailability = async (machineId: string, from?: string): Promise<MachineAvailability> => {
  const query = from === undefined ? '' : `?from=${encodeURIComponent(from)}`
  const response = await fetch(`/api/machines/${machineId}/availability${query}`)

  if (!response.ok) throw new Error(messageOf(await response.json().catch(() => null)))

  return (await response.json()) as MachineAvailability
}
