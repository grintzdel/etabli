import type { MachineId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'

import { getMachineAvailability } from '../application/queries/get-machine-availability/get-machine-availability.query'
import type { AvailabilityParams } from '../domain/booking.schema'

export const bookingHandlers = {
  availability: ({
    path,
    urlParams,
  }: {
    readonly path: { readonly id: MachineId }
    readonly urlParams: AvailabilityParams
  }) => getMachineAvailability(path.id, urlParams).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
}
