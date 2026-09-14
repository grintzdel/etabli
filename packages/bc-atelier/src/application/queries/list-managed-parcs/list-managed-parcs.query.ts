import { AuthContext, MembershipRole } from '@etabli/shared/auth-context'
import type { RepoError } from '@etabli/shared/errors'
import * as Effect from 'effect/Effect'

import type { ManagedParc } from '../../../domain/atelier.schema'
import { toManagedParc } from '../../../domain/atelier.schema'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'

export const listManagedParcs = (): Effect.Effect<
  ReadonlyArray<ManagedParc>,
  RepoError,
  AuthContext | AtelierRepository
> =>
  Effect.gen(function* () {
    const auth = yield* AuthContext
    const repository = yield* AtelierRepository

    const fabmanaged = auth.memberships.filter((membership) => membership.role === MembershipRole.FABMANAGER)

    const parcs = yield* Effect.forEach(fabmanaged, (membership) =>
      Effect.gen(function* () {
        const atelier = yield* repository.findAnyById(membership.atelierId)
        if (atelier === null) return null
        const machines = yield* repository.listMachines(atelier.id)
        return toManagedParc(atelier, machines)
      })
    )

    return parcs.filter((parc): parc is ManagedParc => parc !== null)
  })
