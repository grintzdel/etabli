import type { RepoError } from '@etabli/shared/errors'
import type { AtelierId, UserId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { AtelierStatus, EARTH_RADIUS_KM, MachineStatus } from '../domain/atelier.constants'
import type { Atelier, AtelierSummary, ListAteliersParams, Machine, Membership, Slug } from '../domain/atelier.schema'
import { toAdminAtelier } from '../domain/atelier.schema'
import type { AtelierRepositoryService } from './atelier.repository'
import { AtelierRepository } from './atelier.repository'

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180

export const haversineKm = (
  from: { readonly lat: number; readonly lng: number },
  to: { readonly lat: number; readonly lng: number }
): number => {
  const cosine =
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.cos(toRadians(to.lng) - toRadians(from.lng)) +
    Math.sin(toRadians(from.lat)) * Math.sin(toRadians(to.lat))
  return EARTH_RADIUS_KM * Math.acos(Math.min(1, Math.max(-1, cosine)))
}

export interface AtelierRepositoryMemory extends AtelierRepositoryService {
  readonly ateliers: Map<string, Atelier>
  readonly machines: Map<string, Machine>
  readonly memberships: Map<string, Membership>
}

export const makeAtelierRepositoryMemory = (): AtelierRepositoryMemory => {
  const ateliers = new Map<string, Atelier>()
  const machines = new Map<string, Machine>()
  const memberships = new Map<string, Membership>()

  const liveMachinesOf = (atelierId: AtelierId): ReadonlyArray<Machine> =>
    [...machines.values()].filter(
      (machine) => machine.atelierId === atelierId && machine.status !== MachineStatus.RETIRED
    )

  const listPublished = (params: ListAteliersParams): Effect.Effect<ReadonlyArray<AtelierSummary>, RepoError> =>
    Effect.sync(() => {
      const origin = params.lat === undefined || params.lng === undefined ? null : { lat: params.lat, lng: params.lng }

      const summaries = [...ateliers.values()]
        .filter((atelier) => atelier.status === AtelierStatus.PUBLISHED)
        .filter((atelier) => params.city === undefined || atelier.city.toLowerCase() === params.city.toLowerCase())
        .filter(
          (atelier) =>
            params.machineKind === undefined ||
            liveMachinesOf(atelier.id).some((machine) => machine.kind === params.machineKind)
        )
        .map((atelier): AtelierSummary => {
          const live = liveMachinesOf(atelier.id)
          return {
            id: atelier.id,
            slug: atelier.slug,
            name: atelier.name,
            description: atelier.description,
            city: atelier.city,
            country: atelier.country,
            latitude: atelier.latitude,
            longitude: atelier.longitude,
            machineCount: live.length,
            machineKinds: [...new Set(live.map((machine) => machine.kind))].toSorted(),
            distanceKm: origin === null ? null : haversineKm(origin, { lat: atelier.latitude, lng: atelier.longitude }),
          }
        })
        .filter(
          (summary) =>
            params.radiusKm === undefined || (summary.distanceKm !== null && summary.distanceKm <= params.radiusKm)
        )
        .toSorted((a, b) =>
          a.distanceKm !== null && b.distanceKm !== null
            ? a.distanceKm - b.distanceKm || a.slug.localeCompare(b.slug)
            : a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug)
        )

      return summaries.slice(params.offset, params.offset + params.limit)
    })

  return {
    ateliers,
    machines,
    memberships,
    listPublished,
    findPublishedBySlug: (slug: Slug) =>
      Effect.sync(
        () =>
          [...ateliers.values()].find(
            (atelier) => atelier.slug === slug && atelier.status === AtelierStatus.PUBLISHED
          ) ?? null
      ),
    findPublishedById: (id: AtelierId) =>
      Effect.sync(
        () =>
          [...ateliers.values()].find((atelier) => atelier.id === id && atelier.status === AtelierStatus.PUBLISHED) ??
          null
      ),
    findMembership: (userId: UserId, atelierId: AtelierId) =>
      Effect.sync(
        () =>
          [...memberships.values()].find(
            (membership) => membership.userId === userId && membership.atelierId === atelierId
          ) ?? null
      ),
    listMembershipsForUser: (userId: UserId) =>
      Effect.sync(() => [...memberships.values()].filter((membership) => membership.userId === userId)),
    listMachines: (atelierId) =>
      Effect.sync(() =>
        [...machines.values()]
          .filter((machine) => machine.atelierId === atelierId)
          .toSorted((a, b) => a.name.localeCompare(b.name))
      ),
    listAll: () =>
      Effect.sync(() =>
        [...ateliers.values()]
          .toSorted((a, b) => a.name.localeCompare(b.name))
          .map((atelier) => toAdminAtelier(atelier, liveMachinesOf(atelier.id).length))
      ),
    findAnyById: (id: AtelierId) => Effect.sync(() => ateliers.get(id) ?? null),
    findAnyBySlug: (slug: Slug) =>
      Effect.sync(() => [...ateliers.values()].find((atelier) => atelier.slug === slug) ?? null),
    updateStatus: (id: AtelierId, status: AtelierStatus, at: Atelier['updatedAt']) =>
      Effect.sync(() => {
        const atelier = ateliers.get(id)
        if (atelier === undefined) return null
        const updated = { ...atelier, status, updatedAt: at }
        ateliers.set(id, updated)
        return updated
      }),
    insertAtelier: (atelier) =>
      Effect.sync(() => {
        ateliers.set(atelier.id, atelier)
        return atelier
      }),
    insertMachine: (machine) =>
      Effect.sync(() => {
        machines.set(machine.id, machine)
        return machine
      }),
    insertMembership: (membership) =>
      Effect.sync(() => {
        memberships.set(membership.id, membership)
        return membership
      }),
  }
}

export const AtelierRepositoryMemoryLayer = Layer.sync(AtelierRepository, () =>
  AtelierRepository.of(makeAtelierRepositoryMemory())
)
