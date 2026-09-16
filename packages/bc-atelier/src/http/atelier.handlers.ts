import type { MachineId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'

import { getAtelierBySlug } from '../application/queries/get-atelier-by-slug/get-atelier-by-slug.query'
import { getMachineDetail } from '../application/queries/get-machine-detail/get-machine-detail.query'
import { listAteliers } from '../application/queries/list-ateliers/list-ateliers.query'
import type { ListAteliersParams, Slug } from '../domain/atelier.schema'

export const atelierHandlers = {
  list: ({ urlParams }: { readonly urlParams: ListAteliersParams }) =>
    listAteliers(urlParams).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  getBySlug: ({ path }: { readonly path: { readonly slug: Slug } }) =>
    getAtelierBySlug(path.slug).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
  getMachineById: ({ path }: { readonly path: { readonly id: MachineId } }) =>
    getMachineDetail(path.id).pipe(Effect.catchTag('RepoError', (error) => Effect.die(error))),
}
