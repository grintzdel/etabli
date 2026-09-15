import * as SqlClient from '@effect/sql/SqlClient'
import { RepoError } from '@etabli/shared/errors'
import type { AtelierId, MachineId, UserId } from '@etabli/shared/schema'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { AtelierStatus, EARTH_RADIUS_KM, MachineStatus } from '../domain/atelier.constants'
import type {
  AdminAtelier,
  Atelier,
  AtelierSummary,
  ListAteliersParams,
  Machine,
  MemberAtelier,
  Membership,
  Slug,
  UpdateMachine,
} from '../domain/atelier.schema'
import { Slug as SlugSchema, toAdminAtelier } from '../domain/atelier.schema'
import { AtelierRepository } from './atelier.repository'

interface AtelierRow {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly description: string
  readonly street: string
  readonly postal_code: string
  readonly city: string
  readonly country: string
  readonly latitude: number
  readonly longitude: number
  readonly status: string
  readonly created_at: Date
  readonly updated_at: Date
}

interface SummaryRow {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly description: string
  readonly city: string
  readonly country: string
  readonly latitude: number
  readonly longitude: number
  readonly machine_count: number
  readonly machine_kinds: ReadonlyArray<string> | null
  readonly distance_km: number | null
}

interface MachineRow {
  readonly id: string
  readonly atelier_id: string
  readonly name: string
  readonly description: string
  readonly kind: string
  readonly requires_certification: boolean
  readonly slot_duration_minutes: number
  readonly status: string
  readonly nfc_tag_id: string | null
  readonly created_at: Date
  readonly updated_at: Date
}

interface MemberAtelierRow {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly role: string
}

interface MembershipRow {
  readonly id: string
  readonly user_id: string
  readonly atelier_id: string
  readonly role: string
  readonly status: string
  readonly joined_at: Date
}

const toAtelier = (row: AtelierRow): Atelier => ({
  id: row.id as Atelier['id'],
  slug: SlugSchema.make(row.slug),
  name: row.name,
  description: row.description,
  street: row.street,
  postalCode: row.postal_code,
  city: row.city,
  country: row.country,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  status: row.status as Atelier['status'],
  createdAt: DateTime.unsafeFromDate(row.created_at),
  updatedAt: DateTime.unsafeFromDate(row.updated_at),
})

const toSummary = (row: SummaryRow): AtelierSummary => ({
  id: row.id as AtelierSummary['id'],
  slug: SlugSchema.make(row.slug),
  name: row.name,
  description: row.description,
  city: row.city,
  country: row.country,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  machineCount: Number(row.machine_count),
  machineKinds: (row.machine_kinds ?? []) as AtelierSummary['machineKinds'],
  distanceKm: row.distance_km === null ? null : Number(row.distance_km),
})

interface AdminRow extends AtelierRow {
  readonly machine_count: number
}

const toAdminRow = (row: AdminRow): AdminAtelier => toAdminAtelier(toAtelier(row), Number(row.machine_count))

const toMachine = (row: MachineRow): Machine => ({
  id: row.id as Machine['id'],
  atelierId: row.atelier_id as Machine['atelierId'],
  name: row.name,
  description: row.description,
  kind: row.kind as Machine['kind'],
  requiresCertification: row.requires_certification,
  slotDurationMinutes: Number(row.slot_duration_minutes),
  status: row.status as Machine['status'],
  nfcTagId: row.nfc_tag_id,
  createdAt: DateTime.unsafeFromDate(row.created_at),
  updatedAt: DateTime.unsafeFromDate(row.updated_at),
})

const toMembership = (row: MembershipRow): Membership => ({
  id: row.id as Membership['id'],
  userId: row.user_id as Membership['userId'],
  atelierId: row.atelier_id as Membership['atelierId'],
  role: row.role as Membership['role'],
  status: row.status as Membership['status'],
  joinedAt: DateTime.unsafeFromDate(row.joined_at),
})

const fail = (operation: string) => (cause: unknown) => new RepoError({ cause, operation })

const noRow = (operation: string) => Effect.fail(new RepoError({ cause: 'no row returned', operation }))

export const buildDirectoryQuery = (params: ListAteliersParams): readonly [string, ReadonlyArray<unknown>] => {
  const values: Array<unknown> = []
  const bind = (value: unknown) => {
    values.push(value)
    return `$${values.length}`
  }

  const geo = params.lat !== undefined && params.lng !== undefined && params.radiusKm !== undefined
  const distance = geo
    ? `${EARTH_RADIUS_KM} * acos(least(1, greatest(-1, ` +
      `cos(radians(${bind(params.lat)})) * cos(radians(a.latitude::double precision)) * ` +
      `cos(radians(a.longitude::double precision) - radians(${bind(params.lng)})) + ` +
      `sin(radians(${bind(params.lat)})) * sin(radians(a.latitude::double precision)))))`
    : null

  const conditions = [`a.status = ${bind(AtelierStatus.PUBLISHED)}`]
  if (params.city !== undefined) conditions.push(`lower(a.city) = lower(${bind(params.city)})`)
  if (params.machineKind !== undefined) {
    conditions.push(
      `EXISTS (SELECT 1 FROM machines mk WHERE mk.atelier_id = a.id AND mk.kind = ${bind(params.machineKind)} ` +
        `AND mk.status <> ${bind(MachineStatus.RETIRED)})`
    )
  }
  if (distance !== null) conditions.push(`${distance} <= ${bind(params.radiusKm)}`)

  const text =
    `SELECT a.id, a.slug, a.name, a.description, a.city, a.country, ` +
    `a.latitude::double precision AS latitude, a.longitude::double precision AS longitude, ` +
    `count(m.id)::int AS machine_count, ` +
    `coalesce(array_agg(DISTINCT m.kind) FILTER (WHERE m.id IS NOT NULL), '{}'::text[]) AS machine_kinds, ` +
    `${distance ?? 'NULL::double precision'} AS distance_km ` +
    `FROM ateliers a ` +
    `LEFT JOIN machines m ON m.atelier_id = a.id AND m.status <> ${bind(MachineStatus.RETIRED)} ` +
    `WHERE ${conditions.join(' AND ')} ` +
    `GROUP BY a.id ` +
    `ORDER BY ${distance === null ? 'a.name' : 'distance_km'} ASC, a.slug ASC ` +
    `LIMIT ${bind(params.limit)} OFFSET ${bind(params.offset)}`

  return [text, values]
}

export const makeAtelierRepositorySql = (sql: SqlClient.SqlClient) =>
  AtelierRepository.of({
    listPublished: (params: ListAteliersParams) => {
      const [text, values] = buildDirectoryQuery(params)
      return sql.unsafe<SummaryRow>(text, values as ReadonlyArray<never>).pipe(
        Effect.map((rows) => rows.map(toSummary)),
        Effect.mapError(fail('ateliers.listPublished'))
      )
    },

    findPublishedBySlug: (slug: Slug) =>
      sql<AtelierRow>`
        SELECT id, slug, name, description, street, postal_code, city, country,
               latitude::double precision AS latitude, longitude::double precision AS longitude,
               status, created_at, updated_at
        FROM ateliers
        WHERE slug = ${slug} AND status = ${AtelierStatus.PUBLISHED}
        LIMIT 1
      `.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toAtelier(rows[0]))),
        Effect.mapError(fail('ateliers.findPublishedBySlug'))
      ),

    findPublishedById: (id: AtelierId) =>
      sql<AtelierRow>`
        SELECT id, slug, name, description, street, postal_code, city, country,
               latitude::double precision AS latitude, longitude::double precision AS longitude,
               status, created_at, updated_at
        FROM ateliers
        WHERE id = ${id} AND status = ${AtelierStatus.PUBLISHED}
        LIMIT 1
      `.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toAtelier(rows[0]))),
        Effect.mapError(fail('ateliers.findPublishedById'))
      ),

    findMembership: (userId: UserId, atelierId: AtelierId) =>
      sql<MembershipRow>`
        SELECT * FROM memberships WHERE user_id = ${userId} AND atelier_id = ${atelierId} LIMIT 1
      `.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toMembership(rows[0]))),
        Effect.mapError(fail('memberships.findOne'))
      ),

    listMembershipsForUser: (userId: UserId) =>
      sql<MembershipRow>`SELECT * FROM memberships WHERE user_id = ${userId} ORDER BY joined_at ASC`.pipe(
        Effect.map((rows) => rows.map(toMembership)),
        Effect.mapError(fail('memberships.listForUser'))
      ),

    listMemberAteliersForUser: (userId: UserId) =>
      sql<MemberAtelierRow>`
        SELECT a.id, a.slug, a.name, m.role
        FROM memberships m
        JOIN ateliers a ON a.id = m.atelier_id
        WHERE m.user_id = ${userId}
        ORDER BY m.joined_at ASC
      `.pipe(
        Effect.map((rows) =>
          rows.map((row) => ({
            id: row.id as MemberAtelier['id'],
            slug: row.slug as MemberAtelier['slug'],
            name: row.name,
            role: row.role as MemberAtelier['role'],
          }))
        ),
        Effect.mapError(fail('memberships.listMemberAteliersForUser'))
      ),

    listMachines: (atelierId: AtelierId) =>
      sql<MachineRow>`SELECT * FROM machines WHERE atelier_id = ${atelierId} ORDER BY name ASC`.pipe(
        Effect.map((rows) => rows.map(toMachine)),
        Effect.mapError(fail('machines.listForAtelier'))
      ),

    listAll: () =>
      sql<AdminRow>`
        SELECT a.id, a.slug, a.name, a.description, a.street, a.postal_code, a.city, a.country,
               a.latitude::double precision AS latitude, a.longitude::double precision AS longitude,
               a.status, a.created_at, a.updated_at,
               count(m.id)::int AS machine_count
        FROM ateliers a
        LEFT JOIN machines m ON m.atelier_id = a.id AND m.status <> ${MachineStatus.RETIRED}
        GROUP BY a.id
        ORDER BY a.name ASC
      `.pipe(
        Effect.map((rows) => rows.map(toAdminRow)),
        Effect.mapError(fail('ateliers.listAll'))
      ),

    findAnyById: (id: AtelierId) =>
      sql<AtelierRow>`
        SELECT id, slug, name, description, street, postal_code, city, country,
               latitude::double precision AS latitude, longitude::double precision AS longitude,
               status, created_at, updated_at
        FROM ateliers
        WHERE id = ${id}
        LIMIT 1
      `.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toAtelier(rows[0]))),
        Effect.mapError(fail('ateliers.findAnyById'))
      ),

    findAnyBySlug: (slug: Slug) =>
      sql<AtelierRow>`
        SELECT id, slug, name, description, street, postal_code, city, country,
               latitude::double precision AS latitude, longitude::double precision AS longitude,
               status, created_at, updated_at
        FROM ateliers
        WHERE slug = ${slug}
        LIMIT 1
      `.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toAtelier(rows[0]))),
        Effect.mapError(fail('ateliers.findAnyBySlug'))
      ),

    updateStatus: (id: AtelierId, status: Atelier['status'], at: Atelier['updatedAt']) =>
      sql<AtelierRow>`
        UPDATE ateliers
        SET status = ${status}, updated_at = ${DateTime.toDate(at)}
        WHERE id = ${id}
        RETURNING id, slug, name, description, street, postal_code, city, country,
               latitude::double precision AS latitude, longitude::double precision AS longitude,
               status, created_at, updated_at
      `.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toAtelier(rows[0]))),
        Effect.mapError(fail('ateliers.updateStatus'))
      ),

    insertAtelier: (atelier) =>
      sql<AtelierRow>`
        INSERT INTO ateliers (id, slug, name, description, street, postal_code, city, country, latitude, longitude, status, created_at, updated_at)
        VALUES (
          ${atelier.id}, ${atelier.slug}, ${atelier.name}, ${atelier.description}, ${atelier.street},
          ${atelier.postalCode}, ${atelier.city}, ${atelier.country}, ${atelier.latitude}, ${atelier.longitude},
          ${atelier.status}, ${DateTime.toDate(atelier.createdAt)}, ${DateTime.toDate(atelier.updatedAt)}
        )
        RETURNING id, slug, name, description, street, postal_code, city, country,
                  latitude::double precision AS latitude, longitude::double precision AS longitude,
                  status, created_at, updated_at
      `.pipe(
        Effect.flatMap((rows) =>
          rows[0] === undefined ? noRow('ateliers.insert') : Effect.succeed(toAtelier(rows[0]))
        ),
        Effect.mapError(fail('ateliers.insert'))
      ),

    findMachineById: (id: MachineId) =>
      sql<MachineRow>`SELECT * FROM machines WHERE id = ${id} LIMIT 1`.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toMachine(rows[0]))),
        Effect.mapError(fail('machines.findById'))
      ),

    findMachineByNfcTag: (nfcTagId: string) =>
      sql<MachineRow>`SELECT * FROM machines WHERE nfc_tag_id = ${nfcTagId} LIMIT 1`.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toMachine(rows[0]))),
        Effect.mapError(fail('machines.findByNfcTag'))
      ),

    updateMachine: (id: MachineId, patch: UpdateMachine, at: Machine['updatedAt']) =>
      sql<MachineRow>`
        UPDATE machines
        SET name = coalesce(${patch.name ?? null}::text, name),
            description = coalesce(${patch.description ?? null}::text, description),
            status = coalesce(${patch.status ?? null}::text, status),
            requires_certification = coalesce(${patch.requiresCertification ?? null}::boolean, requires_certification),
            slot_duration_minutes = coalesce(${patch.slotDurationMinutes ?? null}::integer, slot_duration_minutes),
            nfc_tag_id = CASE
              WHEN ${patch.nfcTagId !== undefined}::boolean THEN ${patch.nfcTagId ?? null}::text
              ELSE nfc_tag_id
            END,
            updated_at = ${DateTime.toDate(at)}
        WHERE id = ${id}
        RETURNING *
      `.pipe(
        Effect.map((rows) => (rows[0] === undefined ? null : toMachine(rows[0]))),
        Effect.mapError(fail('machines.update'))
      ),

    insertMachine: (machine) =>
      sql<MachineRow>`
        INSERT INTO machines (id, atelier_id, name, description, kind, requires_certification, slot_duration_minutes, status, nfc_tag_id, created_at, updated_at)
        VALUES (
          ${machine.id}, ${machine.atelierId}, ${machine.name}, ${machine.description}, ${machine.kind},
          ${machine.requiresCertification}, ${machine.slotDurationMinutes}, ${machine.status}, ${machine.nfcTagId},
          ${DateTime.toDate(machine.createdAt)}, ${DateTime.toDate(machine.updatedAt)}
        )
        RETURNING *
      `.pipe(
        Effect.flatMap((rows) =>
          rows[0] === undefined ? noRow('machines.insert') : Effect.succeed(toMachine(rows[0]))
        ),
        Effect.mapError(fail('machines.insert'))
      ),

    insertMembership: (membership) =>
      sql<MembershipRow>`
        INSERT INTO memberships (id, user_id, atelier_id, role, status, joined_at)
        VALUES (
          ${membership.id}, ${membership.userId}, ${membership.atelierId}, ${membership.role},
          ${membership.status}, ${DateTime.toDate(membership.joinedAt)}
        )
        RETURNING *
      `.pipe(
        Effect.flatMap((rows) =>
          rows[0] === undefined ? noRow('memberships.insert') : Effect.succeed(toMembership(rows[0]))
        ),
        Effect.mapError(fail('memberships.insert'))
      ),
  })

export const AtelierRepositorySqlLayer = Layer.effect(
  AtelierRepository,
  Effect.map(SqlClient.SqlClient, makeAtelierRepositorySql)
)
