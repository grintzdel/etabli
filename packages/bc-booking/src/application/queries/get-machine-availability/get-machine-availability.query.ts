import { AuthContext, isMemberOf } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import type { MachineId } from '@etabli/shared/schema'
import { Clock } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'

import { availabilityWindow, buildSlots } from '../../../domain/availability'
import { BookableMachineStatus } from '../../../domain/booking.constants'
import type { AvailabilityParams, MachineAvailability } from '../../../domain/booking.schema'
import { MachineNotBookableError } from '../../../domain/errors'
import { BookingRepository } from '../../../infrastructure/booking.repository'
import { MachineCatalog } from '../../ports/machine-catalog'

export const getMachineAvailability = (
  machineId: MachineId,
  params: AvailabilityParams
): Effect.Effect<
  MachineAvailability,
  MachineNotBookableError | RepoError,
  AuthContext | BookingRepository | MachineCatalog | Clock
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* BookingRepository
    const catalog = yield* MachineCatalog
    const clock = yield* Clock

    const machine = yield* catalog.find(machineId)
    const reachable =
      machine !== null && machine.status !== BookableMachineStatus.RETIRED && isMemberOf(auth, machine.atelierId)
    if (machine === null || !reachable) return yield* Effect.fail(new MachineNotBookableError({ machineId }))

    const now = yield* clock.now
    const window = availabilityWindow(params.from ?? now)
    const bookings = yield* repository.listActiveForMachineBetween(machineId, window.from, window.to)

    return {
      machineId: machine.machineId,
      machineName: machine.machineName,
      atelierId: machine.atelierId,
      atelierName: machine.atelierName,
      atelierSlug: machine.atelierSlug,
      machineStatus: machine.status,
      requiresCertification: machine.requiresCertification,
      slotDurationMinutes: machine.slotDurationMinutes,
      from: window.from,
      to: window.to,
      slots: buildSlots({
        from: window.from,
        now,
        slotDurationMinutes: machine.slotDurationMinutes,
        bookings,
        machineAvailable: machine.status === BookableMachineStatus.AVAILABLE,
      }),
    }
  })
